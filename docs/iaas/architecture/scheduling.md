# Scheduling and Orchestration

This section provides an overview of the scheduling and orchestration mechanisms used in IronCore's Infrastructure as 
a Service (IaaS) layer. It covers the concepts of Pools, poollets, and the IronCore Runtime Interface (IRI),
which together enable efficient resource management and allocation.

## Pools and Classes

The core concept in IronCore's scheduling architecture is the resource Pool. A Pool is announced by a poollet which represents
an entity onto which resources can be scheduled. The announcement of a Pool resource is done by a poollet, which 
also provides in the Pool status the available MachineClasses a Pool supports. A Class in this context represents
a list of resource-specific capabilities that a Pool can provide, such as CPU, memory, and storage.

Pools and Classes are defined for all major resource types in IronCore, including compute and storage. Resources in the
`networking` API have no Pool concept, as they are not scheduled but rather provided on-demand by the network-related
components. The details are described in the [networking section](/iaas/architecture/networking).

An example definition of a Pool from the `compute` API group (MachinePool) is shown below:

```yaml
apiVersion: compute.ironcore.dev/v1alpha1
kind: MachinePool
metadata:
  name: machinepool-sample
spec:
  providerID: ironcore://shared
status:
  availableMachineClasses:
    - name: machineclass-sample
```

The corresponding MachineClass defines the capabilities of the pool, such as CPU and memory:

```yaml
apiVersion: compute.ironcore.dev/v1alpha1
kind: MachineClass
metadata:
  name: machineclass-sample
capabilities:
  cpu: 4
  memory: 16Gi
```

## Scheduling

If a Machine or Volume resource has been created, the IronCore scheduler looks for a suitable Pool that
supports the defined MachineClass or VolumeClass. If a suitable Pool is found, the scheduler sets the `.spec.machinePoolRef`
or `.spec.volumePoolRef` field of the Machine or Volume resource to the name of the Pool. This reference indicates
to the `poollet` responsible for the announced Pool that something needs to be done, such as creating a Machine or Volume resource.

The current scheduler implementation works on a best-effort basis, meaning that it tries to find a suitable Pool and
assign the correct Pool but does not guarantee that the Machine or Volume will be created. A new Reservation-based
scheduling mechanism described in this [enhancement proposal](https://github.com/ironcore-dev/ironcore/blob/main/docs/proposals/11-scheduling.md)
should provide a more robust scheduling mechanism in the future.

::: warning
The scheduler does not account for pool health: even if a `MachinePool` reports `Ready=False` or
`Ready=Unknown` (see [MachinePool Health](/iaas/architecture/machine-pool-health)), it remains a valid
scheduling target and `Machine`s will still be assigned to it.
:::

## Poollets

The poollet's responsibilities besides announcing the Pool are manifold and are depicted in the diagram below:

![Pools and Poollets](/poolsandpoollets.png)

1. **Ensuring prerequisites are met**: In the example of a `Machine`, the creation of a `Machine` should only be 
   proceeded with, if e.g. the root `Volume` of the `Machine` is available. 
2. **Resource Creation**: The `poollet` is responsible for creating the actual resources in the underlying infrastructure, such as 
   virtual machines or storage volumes.
3. **Status Propagation**: The `poollet` updates the status of the `Machine` resource (e.g. `Running`, `Failed`, etc.) based on the 
   state of the underlying resources it manages.

The key role in managing the resources is defined in the [IronCore Runtime Interface (IRI)](/iaas/architecture/runtime-interface), 
which provides a well-defined gRPC interface for each resource group. 

This architecture with resources scheduled on Pools and poollets acting as the resource managers by invoking a backend
interface API corresponds to the same model Kubernetes uses with the Kubelet announcing Nodes and Pods being scheduled
on Nodes. The Kubelet interacts via the Container Runtime Interface (CRI) with the container runtime, to manifest
the actual instance of a Pod.
