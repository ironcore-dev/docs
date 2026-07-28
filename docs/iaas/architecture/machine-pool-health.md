# MachinePool Health

To determine the availability and health of a `MachinePool`, IronCore implements a heartbeat and status
condition mechanism modeled after the Kubernetes node heartbeat design. It allows operators, the scheduler,
and higher-level automation to tell at a glance whether a `MachinePool` and its `machinepoollet` are able to
serve workloads — without having to probe the pool by trial and error.

The mechanism is specified in [IEP-15: Pool Health](https://github.com/ironcore-dev/enhancements/blob/main/ieps/15-pool-health.md)
and involves two parties:

1. **The `machinepoollet`**, which regularly reports its health by renewing a `Lease` object and by
   propagating a `Ready` condition onto the `MachinePool`'s `.status.conditions`.
2. **The `MachinePool` lifecycle controller** in the IronCore control plane (`ironcore-controller-manager`),
   which watches the `MachinePool`s and their leases and marks a pool's `Ready` condition as `Unknown` if the
   `machinepoollet` stops reporting.

::: info
Health reporting is currently only implemented for `MachinePool`. The `VolumePool` and `BucketPool` types
are not covered by this mechanism.
:::

## Heartbeating via Leases

For every `MachinePool`, the `machinepoollet` acquires and keeps a
[`coordination.k8s.io/v1 Lease`](https://kubernetes.io/docs/concepts/architecture/leases/) named after the
pool in the `ironcore-machinepool-lease` namespace. For example, for a `MachinePool` named `my-machinepool`:

```yaml
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: my-machinepool
  namespace: ironcore-machinepool-lease
spec:
  holderIdentity: my-machinepool_0c8914f7-0f35-440e-8676-7844977d3a05
  leaseDurationSeconds: 40
  renewTime: "2026-05-01T13:18:48.065888Z"
```

The `machinepoollet` renews this lease on every heartbeat tick. The `holderIdentity` is unique per poollet
process (`<pool-name>_<uuid>`), so a restarted poollet transparently takes over the lease from its stale
predecessor. The lease does not by itself decide pool health — it is one of the two signals the lifecycle
controller observes (see below).

## The `Ready` Condition

In addition to the lease, the `machinepoollet` regularly reflects the result of an
[IRI `Status`](/iaas/architecture/runtime-interface) probe into the `MachinePool`'s `.status.conditions` as a
condition of type `Ready`:

- `Ready=True` — the last IRI `Status` probe succeeded; the machine runtime is reachable and the pool is
  ready to serve workloads:

  ```yaml
  status:
    conditions:
      - type: Ready
        status: "True"
        reason: HeartbeatReceived
        message: machine runtime status probe succeeded
        observedGeneration: 4
        lastTransitionTime: "2026-05-01T13:18:48.065888Z"
  ```

- `Ready=False` — the IRI `Status` probe failed; the `machinepoollet` is alive (it still renews its lease),
  but the underlying machine runtime is unreachable:

  ```yaml
  status:
    conditions:
      - type: Ready
        status: "False"
        reason: RuntimeUnreachable
        message: <error returned by the machine runtime>
        observedGeneration: 4
        lastTransitionTime: "2026-05-01T13:18:48.065888Z"
  ```

- `Ready=Unknown` — set by the control-plane lifecycle controller when the `machinepoollet` has stopped
  reporting altogether (see the next section):

  ```yaml
  status:
    conditions:
      - type: Ready
        status: Unknown
        reason: MachinePoolStatusUnknown
        message: machinepoollet stopped posting machine pool status.
        observedGeneration: 4
        lastTransitionTime: "2026-05-01T13:18:48.065888Z"
  ```

Inside the `machinepoollet`, a dedicated heartbeat runnable performs the IRI `Status` probe and the lease
renewal on a fixed interval, while the pool reconciler remains the single writer of the pool's status.
Whenever the probe result changes, the heartbeat nudges the reconciler via an event so the `Ready` condition
is updated promptly without waiting for an unrelated reconcile trigger. Condition updates only happen on
actual changes, so a steady-state pool does not cause continuous status writes.

The one exception to reconciler-only status writes is the `MachinePool` lifecycle controller in the
`ironcore-controller-manager`: when it judges a pool unresponsive, it patches `Ready=Unknown` directly (see
next section).

## Detecting Unresponsive MachinePools

The `MachinePoolLifecycle` controller in the `ironcore-controller-manager` monitors all `MachinePool` objects
and their leases. A pool is considered *making progress* if either its lease was renewed or its `Ready`
condition changed since the last observation. If no progress has been detected for longer than a configurable
grace period, the controller marks the pool's `Ready` condition as `Unknown` with the reason
`MachinePoolStatusUnknown`.

The controller deliberately **does not inspect timestamps** of leases or conditions, as comparing timestamps
is prone to failure due to clock skew between the poollet host and the control plane. Instead, it tracks the
point in time at which it last *observed a change* and reacts only when no change has been seen for the whole
grace period. When the `machinepoollet` recovers and renews its lease or updates its condition again, the
lifecycle controller detects the change and the poollet resumes publishing `Ready=True`/`False`.

This mirrors the Kubernetes node lifecycle controller behavior and provides the foundation for subsequent
features like pool rolling and workload eviction, which rely on accurate pool health information.

::: warning
The IronCore scheduler currently does **not** consider the `Ready` condition when placing `Machine`s on a `MachinePool`.
Workloads can therefore still be assigned to an unhealthy pool, where they remain unprocessed until the `machinepoollet` recovers.
:::

## Configuration and Defaults

The default timing parameters follow the Kubernetes kubelet and node controller defaults:

| Component                     | Flag                                    | Default | Description                                                                                   |
|-------------------------------|-----------------------------------------|---------|-----------------------------------------------------------------------------------------------|
| `machinepoollet`              | `--heartbeat-interval`                  | `10s`   | Interval between heartbeats (lease renewal + IRI `Status` probe).                             |
| `machinepoollet`              | `--heartbeat-lease-duration`            | `40s`   | `leaseDurationSeconds` published on the pool's lease. Must be greater than the heartbeat interval. |
| `machinepoollet`              | `--heartbeat-status-timeout`            | `5s`    | Timeout for the IRI `Status` probe. Must be smaller than the heartbeat interval.              |
| `ironcore-controller-manager` | `--machine-pool-lifecycle-grace-period` | `50s`   | Time without any observed lease or condition change before a pool's `Ready` condition is marked `Unknown`. |

For these timers to work correctly, the lease duration must exceed the heartbeat interval, and the lifecycle
grace period should comfortably exceed the lease duration, so that a few missed heartbeats do not immediately
mark a pool as unresponsive.
