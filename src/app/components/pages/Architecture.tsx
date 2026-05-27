import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Server, Database, Cloud, Code, Zap, Lock, Globe, Layers } from 'lucide-react';

export function Architecture() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">
            <Layers className="w-3 h-3" />
            Technical Architecture
          </Badge>
          <h1 className="text-4xl font-bold mb-4">How WishList Works</h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Built with modern technologies for performance, scalability, and user experience
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Frontend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Frontend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">React 18.3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">Tailwind CSS v4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">Motion (Animations)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">React Router</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">Radix UI</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 mt-4">
                  Modern, responsive UI with smooth animations and premium design
                </p>
              </Card>
            </motion.div>

            {/* Backend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-4">
                  <Server className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Backend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">Node.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">Express.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">REST API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">JWT Auth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">WebSockets</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 mt-4">
                  Fast, scalable API with real-time notifications
                </p>
              </Card>
            </motion.div>

            {/* Database */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Database</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium">MongoDB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium">Redis Cache</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium">Cloud Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium">Search (Elastic)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-medium">Analytics</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 mt-4">
                  Flexible NoSQL with fast caching and search
                </p>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-foreground/70">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Data Flow */}
        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <h2 className="text-2xl font-bold mb-6">Data Flow</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {dataFlow.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-3`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-medium mb-1">{step.title}</p>
                  <p className="text-xs text-foreground/60">{step.description}</p>
                </div>
                {index < dataFlow.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Instant notifications when gifts are reserved or wishlists are updated using WebSocket connections',
    gradient: 'from-primary to-accent'
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'End-to-end encryption for sensitive data, JWT authentication, and granular privacy controls',
    gradient: 'from-secondary to-primary'
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'Hosted on AWS with auto-scaling, load balancing, and 99.9% uptime SLA',
    gradient: 'from-accent to-secondary'
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Images and assets served via CloudFront CDN for lightning-fast load times worldwide',
    gradient: 'from-primary to-secondary'
  }
];

const dataFlow = [
  {
    icon: Code,
    title: 'User Action',
    description: 'Interacts with UI',
    gradient: 'from-primary to-accent'
  },
  {
    icon: Zap,
    title: 'API Request',
    description: 'Sent to backend',
    gradient: 'from-secondary to-primary'
  },
  {
    icon: Server,
    title: 'Processing',
    description: 'Business logic',
    gradient: 'from-accent to-secondary'
  },
  {
    icon: Database,
    title: 'Data Storage',
    description: 'Saved to DB',
    gradient: 'from-primary to-secondary'
  },
  {
    icon: Globe,
    title: 'Response',
    description: 'Return to user',
    gradient: 'from-secondary to-accent'
  }
];
