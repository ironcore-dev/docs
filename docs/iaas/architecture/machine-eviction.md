# Machine Eviction

Machine eviction lets an operator gracefully remove all `Machine`s from a `MachinePool`. This feature can be used for
example before a backing server goes into maintenance. Without it, the host is shut down while the
`Machine` objects in the API still appear to be running, and there is no way to signal that the VMs
on the pool should be shut down in an ordered fashion first.

Eviction is modeled after the Kubernetes taint eviction pattern: setting a `NoExecute` taint on a
`MachinePool` triggers deletion of every bound `Machine` that does not tolerate the taint. The
provider then handles graceful VM shutdown via its existing finalizer before the object is fully
removed.

The mechanism is specified in
[IEP-21: Machine Eviction](https://github.com/ironcore-dev/enhancements/blob/main/ieps/21-machine-eviction.md)
and involves two parties:
1. **The taint eviction controller** in the IronCore control plane, which watches `MachinePool`
   taint changes and issues `DELETE` on bound `Machine`s that do not tolerate a `NoExecute` taint.
2. **The `machinepoollet`**, which observes the resulting `deletionTimestamp`, drives the provider
   to shut the VM down, and then releases the object by removing its finalizer.

## Taint Effects

Eviction is driven by the taint effect set on a `MachinePool`:

- `NoSchedule` — prevents new `Machine`s from being scheduled onto the pool. Existing machines are
  left untouched.
- `NoExecute` — additionally signals that machines already bound to the pool must be deleted unless
  they tolerate the taint.

A `Machine` **tolerates** a taint when its `spec.tolerations` contains an entry matching the taint's
`key`, `value`, and `effect`. Tolerating machines are retained; all others are evicted.

The two effects compose into a drain pattern: first cordon the pool with `NoSchedule` so no new
work lands on it, then evict the running machines with `NoExecute`.

Tainting a `MachinePool` for eviction looks like this:

```yaml
apiVersion: compute.ironcore.dev/v1alpha1
kind: MachinePool
metadata:
  name: my-machinepool
spec:
  taints:
    - key: maintenance
      value: "true"
      effect: NoExecute
```

## Eviction Flow

Every `Machine` carries a finalizer set by the `machinepoollet`:

```yaml
metadata:
  finalizers:
    - machinepoollet.ironcore.dev/machine
```

This finalizer ensures the object is not removed from the API until the poollet has confirmed the
VM is shut down. Deleting a `Machine` therefore blocks on graceful shutdown rather than dropping the
object immediately.

When a `NoExecute` taint is added to a `MachinePool`, eviction proceeds as follows:

1. The `NoExecute` taint is added to the `MachinePool`.
2. The taint eviction controller issues `DELETE` on every bound `Machine` that has no matching
   toleration.
3. The `Machine` receives a `deletionTimestamp`; the finalizer blocks its removal.
4. The `machinepoollet` reconciles the `Machine`:
   1. Calls the provider to shut down and delete the VM.
   2. Removes its finalizer.
5. The API server removes the `Machine` object once the finalizer is gone.

Machines that tolerate the taint skip steps 2–5 and remain running on the pool.
