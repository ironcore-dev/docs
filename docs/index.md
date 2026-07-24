---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "IronCore Project"
  text: "Cloud Native Infrastructure Management"
  tagline: "IronCore is an Open-Source platform designed to empower users by providing a robust Infrastructure as a Service layer, Bare Metal Management, Network Automation, and AI/Accelerator Infrastructure"
  image:
    src: https://raw.githubusercontent.com/ironcore-dev/ironcore/refs/heads/main/docs/assets/logo_borderless.svg
    alt: IronCore
  actions:
    - theme: brand
      text: Overview
      link: /overview/
    - theme: alt
      text: Infrastructure as a Service
      link: /iaas/getting-started
    - theme: alt
      text: Bare Metal Management
      link: /baremetal/
    - theme: alt
      text: Network Automation
      link: /network-automation/

features:
  - title: 🔍 Automatic Discovery & Provisioning
    details: Detect and provision bare metal servers automatically using Kubernetes-native CRDs.
  - title: 🧰 Declarative Day-2 Operations
    details: Manage BIOS, firmware, and hardware inventory declaratively via Kubernetes.
  - title: ☁️ Modular IaaS Building Blocks
    details: Pluggable compute (CPU and GPU), storage, and networking providers designed for hybrid and edge deployments.
  - title: 🚀 AI & Accelerator Infrastructure
    details: Discover, provision, and manage GPU and accelerator resources declaratively to run AI/ML workloads.
  - title: 🔗 Native Kubernetes Integration
    details: Seamless integration with CSI, CCM, Cluster API, and Gardener.
  - title: 👨‍💻 DevOps-Ready by Design
    details: End-to-end infrastructure and lifecycle management powered by a declarative Kubernetes API.
---
