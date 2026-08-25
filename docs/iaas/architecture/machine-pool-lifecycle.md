# MachinePool Lifecycle

The `pool-lifecycle-controller` coordinates [Cluster API](https://cluster-api.sigs.k8s.io/) (CAPI)
node deletion with graceful eviction of the IronCore `Machine`s running on the affected pool.
A CAPI compute node backs an IronCore `MachinePool`, and the IronCore VMs of that pool run on it.
So when CAPI replaces or deletes such a node for instance during a rolling upgrade or scale-down, 
deleting it while those VMs are still running would drop their workloads. This
controller holds the node deletion until the pool has been drained.

It builds directly on the [Machine Eviction](/iaas/architecture/machine-eviction) mechanism:
draining is performed by tainting the `MachinePool` with a `NoExecute` maintenance taint and waiting
for the eviction to complete.

The controller reconciles the external CAPI `Machine` together with IronCore `MachinePool`/`Machine`.

A CAPI `Machine` is linked to the `MachinePool` it backs through its `status.nodeRef.name`, which
matches the `MachinePool` name.

## The Pre-Drain Hook

CAPI supports [pre-drain lifecycle hooks](https://cluster-api.sigs.k8s.io/tasks/experimental-features/lifecycle-hooks):
an annotation on a CAPI `Machine` that pauses deletion before the node is drained until the
annotation is removed. The controller uses this to interpose IronCore eviction.

For every CAPI `Machine` matching the configured selector, the controller ensures two things while
the machine is alive:

```yaml
metadata:
  finalizers:
    - maintenance.ironcore.dev/machinepool-cleanup
  annotations:
    pre-drain.delete.hook.machine.cluster.x-k8s.io/ironcore-maintenance: ironcore-maintenance
```

- The **finalizer** keeps the controller in the loop when the CAPI `Machine` is deleted, so it can
  run its cleanup before the object disappears.
- The **pre-drain hook** blocks CAPI from draining and removing the node until the controller
  clears it.

Which CAPI `Machine`s are managed is restricted by the `--capi-machine-selector` label selector
(empty selects all).

## Lifecycle Flow

When CAPI decides to delete a `Machine` (setting its `deletionTimestamp`), it stalls at the
pre-drain hook and the controller takes over:

1. The controller resolves the `MachinePool` from the CAPI `Machine`'s `status.nodeRef.name`.
2. It ensures the maintenance taints on that `MachinePool`, adding both effects under the key
   `maintenance.ironcore.dev`:

   ```yaml
   spec:
     taints:
       - key: maintenance.ironcore.dev
         effect: NoSchedule
       - key: maintenance.ironcore.dev
         effect: NoExecute
   ```

   `NoSchedule` stops new machines from landing on the pool while it is draining; `NoExecute`
   triggers [eviction](/iaas/architecture/machine-eviction) of every bound `Machine` that does
   not tolerate the taint.
3. It checks whether any non-tolerating `Machine`s are still bound to the pool. As long as some
   remain, it **holds the pre-drain hook** and requeues. The node stays up while VMs shut down
   gracefully.
4. Once the pool is drained (only tolerating machines, if any, remain), the controller **removes the
   pre-drain hook**, allowing CAPI to drain the Kubernetes node and delete it.
5. After CAPI has removed its own `Machine` finalizer, the controller **deletes the now-empty
   `MachinePool`** object.
6. Finally, it removes its own finalizer from the CAPI `Machine`, letting the object be garbage
   collected.

If a CAPI `Machine` has no `status.nodeRef` (it never became a node), there is nothing to drain: the
controller simply clears the pre-drain hook and its finalizer.


## Relationship to Eviction and Health

This controller is the automation layer that turns an infrastructure-level node deletion into an
ordered IronCore drain. It leans on two lower-level mechanisms:

- [Machine Eviction](/iaas/architecture/machine-eviction) provides the `NoExecute` taint
  semantics and the per-`Machine` graceful shutdown that the controller drives.
- [MachinePool Health](/iaas/architecture/machine-pool-health) provides the pool status the broader
  system relies on; note that this controller reacts to *planned* CAPI node deletions, not to a pool
  becoming unhealthy on its own.
