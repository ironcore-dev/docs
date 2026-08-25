import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "IronCore Project",
  description: "IronCore Project - Cloud Native Infrastructure Management",
  base: '/',
  head: [
      ['link', { rel: 'icon', href: 'https://raw.githubusercontent.com/ironcore-dev/ironcore/refs/heads/main/docs/assets/logo_borderless.svg' }],
      ['meta', {property: 'og:type', content: 'website'}],
      ['meta', {property: 'og:title', content: 'IronCore Project - Cloud Native Infrastructure Management'}],
      ['meta', {property: 'og:description', content: 'IronCore is an Open-Source platform designed to empower users by providing a robust Infrastructure as a Service layer, Bare Metal Management, Network Automation, and AI/Accelerator Infrastructure'}],
      ['meta', {property: 'og:site_name', content: 'IronCore Project'}],
      ['meta', {property: 'og:image', content: 'https://raw.githubusercontent.com/ironcore-dev/ironcore-dev.github.io/refs/heads/main/docs/public/og-ironcore.png'}],
      ['meta', {property: 'og:url', content: 'https://ironcore.dev/'}],
  ],
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(
              new URL('./theme/components/VPFooter.vue', import.meta.url)
          )
        },
      ]
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: 'Home', link: '/'},
      {text: 'Overview', link: '/overview/'},
      {text: 'Documentation',
      items: [
        {text: 'Infrastructure as a Service', link: '/iaas/getting-started'},
        {text: 'Bare Metal Management', link: '/baremetal/'},
        {text: 'Network Automation', link: '/network-automation/'},
      ]},
      {text: 'Community', link: 'https://ironcore.dev/community/', target: '_self'},
    ],

    editLink: {
      pattern: 'https://github.com/ironcore-dev/ironcore-dev.github.io/blob/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    logo: {
      src: 'https://raw.githubusercontent.com/ironcore-dev/ironcore/refs/heads/main/docs/assets/logo_borderless.svg',
      width: 24,
      height: 24
    },

    search: {
      provider: 'local'
    },

    sidebar: {
      '/overview/': [
        {
            text: 'Overview',
            items: [
            { text: 'Index', link: '/overview/' },
            { text: 'Design Principles', link: '/overview/principles' },
            ]
        }
      ],
      '/iaas/': [
        {
            text: 'Infrastructure as a Service',
            collapsed: false,
            items: [
                { text: 'Getting Started', link: '/iaas/getting-started' },
            ],
        },
        {
          text: 'Usage Guides',
          collapsed: true,
          items: [
              { text: 'Overview', link: '/iaas/usage-guides/' },
              { text: 'Compute', link: '/iaas/usage-guides/compute'},
              { text: 'Networking', link: '/iaas/usage-guides/networking' },
              { text: 'Storage', link: '/iaas/usage-guides/storage' },
              { text: 'IPAM', link: '/iaas/usage-guides/ipam' },
              { text: 'Core', link: '/iaas/usage-guides/core' },
          ],
        },
        {
            text: "Architecture",
            collapsed: false,
            items: [
                { text: 'Overview', link: '/iaas/architecture/' },
                { text: 'Scheduling and Orchestration', link: '/iaas/architecture/scheduling' },
                { text: 'Runtime Interface', link: '/iaas/architecture/runtime-interface' },
                {
                  text: 'Pools and Lifecycle',
                  collapsed: true,
                  items: [
                    { text: 'MachinePool Health', link: '/iaas/architecture/machine-pool-health' },
                    { text: 'Machine Eviction', link: '/iaas/architecture/machine-eviction' },
                    { text: 'MachinePool Lifecycle (CAPI)', link: '/iaas/architecture/machine-pool-lifecycle' },
                  ],
                },
                { text: 'Networking', link: '/iaas/architecture/networking' },
                { text: 'Operating System Images', link: '/iaas/architecture/os-images' },
            ],
        },
        {
          text: "Providers",
          collapsed: false,
          items: [
            { text: 'Overview', link: '/iaas/architecture/providers/' },
            { text: 'Brokers', link: '/iaas/architecture/providers/brokers' },
            { text: 'libvirt-provider', link: '/iaas/architecture/providers/libvirt-provider' },
            { text: 'ceph-provider', link: '/iaas/architecture/providers/ceph-provider' },
          ],
        },
        {
          text: "Kubernetes Integration",
          collapsed: false,
          items: [
            { text: 'Overview', link: '/iaas/kubernetes/' },
            { text: 'Cloud Controller Manager', link: '/iaas/kubernetes/cloud-controller-manager' },
            { text: 'CSI Driver', link: '/iaas/kubernetes/csi-driver' },
            { text: 'Gardener Integration', link: '/iaas/kubernetes/gardener' },
          ],
        },
        {
          text: "API References",
          collapsed: true,
          items: [
            { text: 'Overview', link: '/iaas/api-references/' },
            { text: 'Core', link: '/iaas/api-references/core' },
            { text: 'Compute', link: '/iaas/api-references/compute' },
            { text: 'Storage', link: '/iaas/api-references/storage' },
            { text: 'Networking', link: '/iaas/api-references/networking' },
            { text: 'IPAM', link: '/iaas/api-references/ipam' },
            { text: 'Common', link: '/iaas/api-references/common' },
          ],
        },
      ],
    '/baremetal/': [
      {
        text: 'Bare Metal Management',
        items: [
          { text: 'Overview', link: '/baremetal/' },
        ],
      },
      {
        text: "Architecture",
        collapsed: false,
        items: [
          { text: 'Overview', link: '/baremetal/architecture/' },
          { text: 'Discovery', link: '/baremetal/architecture/discovery' },
          { text: 'Provisioning', link: '/baremetal/architecture/provisioning' },
        ],
      },
      {
        text: "Kubernetes Integration",
        collapsed: false,
        items: [
          { text: 'Overview', link: '/baremetal/kubernetes/' },
          { text: 'Cloud Controller Manager', link: '/baremetal/kubernetes/cloud-controller-manager' },
          { text: 'Metal Loadbalancer Controller', link: '/baremetal/kubernetes/metal-loadbalancer-controller' },
          { text: 'Cluster API Provider', link: '/baremetal/kubernetes/capi' },
          { text: 'Gardener Integration', link: '/baremetal/kubernetes/gardener' },
        ],
      },
      {
        text: "API References",
        collapsed: true,
        items: [
          { text: 'Overview', link: '/baremetal/api-references/' },
          { text: 'metal-operator', link: '/baremetal/api-references/metal-operator' },
          { text: 'boot-operator', link: '/baremetal/api-references/boot-operator' },
        ],
      },
    ],
    '/network-automation/': [
      {
        text: 'Overview', link: '/network-automation/',
      },
    ],
    '/community/': [
      {
        text: 'Community',
        items: [
          { text: 'Welcome', link: '/community/' },
          { text: 'Contributing Guide', link: '/community/contributing' },
        ],
      },
      {
        text: 'Style Guide',
        collapsed: false,
        items: [
          { text: 'Coding', link: '/community/style-guide/coding' },
          { text: 'Documentation', link: '/community/style-guide/documentation' },
        ],
      },
    ],
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/ironcore-dev',
      },
      {
        icon: 'slack',
        link: 'https://join.slack.com/t/ironcore-dev/shared_invite/zt-3o0qo3j90-pbqV0io1B~Z~LqeAp4n2Vg'
      },
    ],
  }
})
