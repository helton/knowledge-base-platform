# Next.js Frontend for Knowledge Base Platform

This is the Next.js frontend for the Knowledge Base Platform, providing a modern, type-safe interface for managing knowledge bases and documents.

## Features

- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Type Safety**: Full TypeScript support with proper type definitions
- **Real-time Updates**: Client-side state management with React hooks
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **API Integration**: Seamless integration with FastAPI backend

## Prerequisites

- Node.js 18+ and npm
- FastAPI backend running on `http://localhost:8000`

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/nextjs/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── dashboard.tsx      # Dashboard component
│   ├── documents.tsx      # Documents management
│   ├── header.tsx         # Application header
│   ├── knowledge-bases.tsx # Knowledge bases list
│   ├── settings.tsx       # Settings component
│   ├── sidebar.tsx        # Navigation sidebar
│   └── welcome.tsx        # Welcome screen
├── lib/                   # Utility libraries
│   └── api-client.ts      # API client for backend
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## API Integration

The frontend communicates with the FastAPI backend through the `api-client.ts` module. The API client provides:

- Type-safe API calls
- Error handling
- Request/response interceptors
- Automatic retry logic

## Development

### Adding New Components

1. Create a new component in the `components/` directory
2. Use TypeScript interfaces for props
3. Follow the existing component patterns
4. Add proper error handling and loading states

### Styling

- Use Tailwind CSS classes for styling
- Follow the design system defined in `tailwind.config.js`
- Use CSS variables for theming (light/dark mode support)

### State Management

- Use React hooks for local state
- Use localStorage for persistence where needed
- Keep state as close to where it's used as possible

## Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Ensure the FastAPI backend is running on port 8000
2. **TypeScript Errors**: Run `npm install` to ensure all dependencies are installed
3. **Build Errors**: Check that all imports are correct and components are properly exported

### Getting Help

- Check the browser console for error messages
- Verify the API endpoints are working with curl or Postman
- Ensure all environment variables are set correctly 