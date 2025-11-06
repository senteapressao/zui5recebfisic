# Technology Stack

## Framework & Libraries
- **UI5 Framework**: SAPUI5/OpenUI5 version 1.108.0
- **UI5 Libraries**: sap.m, sap.ui.core
- **Theme**: sap_horizon
- **OData Version**: 2.0
- **Backend**: SAP ABAP On-Premise system

## Build System & Tools
- **Build Tool**: UI5 CLI (@ui5/cli ^3.0.0)
- **Development Tools**: SAP Fiori tools, SAP UX tooling
- **Mock Server**: @sap-ux/ui5-middleware-fe-mockserver

## Common Commands

### Development
```bash
# Start application with Fiori Launchpad
npm start

# Start with local configuration
npm run start-local

# Start without Fiori Launchpad
npm run start-noflp

# Start with mock data
npm run start-mock
```

### Testing
```bash
# Run unit tests
npm run unit-test

# Run integration tests
npm run int-test
```

### Build & Deploy
```bash
# Build application
npm run build

# Deploy verification
npm run deploy

# Configure deployment
npm run deploy-config
```

### Development Features
```bash
# Start with variants management/RTA mode
npm run start-variants-management
```

## Configuration Files
- `ui5.yaml`: Main UI5 tooling configuration
- `ui5-local.yaml`: Local development configuration
- `ui5-mock.yaml`: Mock server configuration
- `manifest.json`: Application descriptor