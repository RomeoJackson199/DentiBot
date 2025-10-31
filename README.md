# DentiBot - Complete Dental Practice Management System

> AI-powered dental practice management platform built for modern dental professionals

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4.svg)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.io/)

## 🦷 What is DentiBot?

DentiBot is a comprehensive, production-ready dental practice management platform that helps dentists and dental practices manage their entire operation from a single, intuitive interface. From appointment scheduling to patient records, billing to inventory management—everything you need to run a modern dental practice.

### Key Features

- **🗓️ Smart Scheduling** - Intelligent appointment calendar with AI-powered triage
- **📋 Patient Records** - Complete digital health records with treatment history
- **💳 Billing & Payments** - Integrated payment processing and invoice management
- **📦 Inventory Management** - Track supplies with low-stock alerts
- **📊 Analytics & Reporting** - Practice performance metrics and insights
- **🔔 Automated Reminders** - Reduce no-shows with SMS/email reminders
- **👥 Multi-Provider Support** - Manage multiple dentists and locations
- **🤖 AI Assistant** - Chatbot for patient triage and support
- **🔒 HIPAA Compliant** - Enterprise-grade security and encryption
- **📱 Mobile Responsive** - Progressive Web App (PWA) for mobile devices

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager
- **Supabase account** - [Create free account](https://supabase.com)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/DentiBot.git
cd DentiBot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Set up the database**

Run the Supabase migrations to set up your database schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

5. **Start the development server**

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`

## 🏗️ Tech Stack

### Frontend
- **React 18.3** - UI library with hooks and concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool with HMR
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components built on Radix UI
- **Framer Motion** - Advanced animations
- **React Router v6** - Client-side routing
- **React Hook Form + Zod** - Form handling with validation

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **PostgREST** - Auto-generated REST API
- **Row Level Security (RLS)** - Multi-tenant data isolation

### State Management
- **TanStack React Query v5** - Server state management with caching
- **Context API** - Application-level state

### Additional Libraries
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icon library
- **cmdk** - Command palette
- **Mapbox GL** - Map integration

## 📁 Project Structure

```
DentiBot/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── patient/        # Patient portal components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── appointments/   # Appointment management
│   │   ├── medical/        # Medical records
│   │   ├── payments/       # Payment handling
│   │   └── ...
│   ├── pages/              # Page components (routes)
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   ├── integrations/       # Supabase client & API
│   ├── types/              # TypeScript definitions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── supabase/              # Database migrations & functions
├── docs/                  # Documentation
└── tests/                 # Test files

```

## 🎨 Design System

DentiBot uses a comprehensive design system with:
- **Color Palette**: HSL-based theming for dark/light modes
- **Typography**: Poppins, DM Sans, Inter fonts
- **Components**: 50+ pre-built UI components
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: WCAG 2.1 AA compliant

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete guidelines.

## 👥 User Roles

### Patients
- Book and manage appointments
- View treatment history and prescriptions
- Access medical records
- Communicate with dentists
- Track payments and billing

### Dentists/Providers
- Manage appointment calendar
- Access patient records
- Create prescriptions and treatment plans
- Track practice analytics
- Manage staff and inventory
- Configure clinic settings

### Admin
- Multi-location management
- User role management
- System configuration
- Data import/export

## 🔐 Security & Compliance

- **HIPAA Compliant** - Healthcare data protection standards
- **GDPR Ready** - Privacy compliance tools and data export
- **Encryption** - End-to-end encryption for sensitive data
- **Row Level Security** - Database-level access control
- **Audit Logs** - Track all data access and modifications
- **Role-Based Access Control** - Granular permission system

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

The build outputs to the `dist/` directory.

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Deploy to Netlify

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Deploy to Other Platforms

The app is a standard Vite/React SPA and can be deployed to any static hosting platform:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Render
- Railway

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for detailed guides.

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

## 📚 Documentation

- [Design System](./DESIGN_SYSTEM.md) - UI/UX guidelines
- [Notification System](./NOTIFICATION_SYSTEM.md) - Real-time notifications
- [Dentist Dashboard Guide](./DENTIST_DASHBOARD_GUIDE.md) - Portal walkthrough
- [Deployment Instructions](./DEPLOYMENT_INSTRUCTIONS.md) - Deployment guides
- [Production Readiness](./PRODUCTION_READINESS_IMPROVEMENTS.md) - Enterprise features

## 🐛 Troubleshooting

### Common Issues

**Build fails with "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Supabase connection errors**
- Verify your `.env` file has correct credentials
- Check if Supabase project is active
- Ensure RLS policies are properly configured

**TypeScript errors**
```bash
npm run fix:types
```

**Blank page after deployment**
- Check browser console for errors
- Verify environment variables are set
- Ensure Supabase URL is accessible

## 📧 Support

- **Email**: support@dentibot.com
- **Documentation**: [docs.dentibot.com](https://docs.dentibot.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/DentiBot/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Backend powered by [Supabase](https://supabase.io)

## 🗺️ Roadmap

- [ ] Mobile apps (iOS & Android)
- [ ] SMS reminders via Twilio
- [ ] Video consultations
- [ ] Advanced analytics with ML
- [ ] Multi-language support (Spanish, French, German)
- [ ] Insurance claim integration
- [ ] Lab integration for orders
- [ ] Patient portal mobile app

---

**Project URL**: https://lovable.dev/projects/952bbe84-3a4d-4f46-b2b7-7a7945d9eaf0

Made with ❤️ for dental professionals
