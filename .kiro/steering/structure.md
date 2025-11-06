# Project Structure

## Root Level
- `package.json`: Node.js dependencies and npm scripts
- `ui5.yaml`: Main UI5 tooling configuration with proxy and middleware setup
- `ui5-local.yaml`: Local development configuration
- `ui5-mock.yaml`: Mock server configuration
- `README.md`: Project documentation and setup instructions

## webapp/ - Application Source
This is the main application folder following SAP Fiori conventions:

### Core Files
- `Component.js`: Main application component extending UIComponent
- `manifest.json`: Application descriptor (sap.app, sap.ui, sap.ui5 sections)
- `index.html`: Application entry point

### Folder Structure
- `controller/`: MVC controllers for application logic
- `view/`: XML views for UI definition
- `model/`: Data models and model utilities
- `i18n/`: Internationalization resource bundles
- `css/`: Custom stylesheets (style.css)
- `localService/`: Mock data and metadata for local development
- `test/`: Unit and integration tests

## Architecture Patterns

### MVC Pattern
- **Views**: XML-based declarative views in `view/` folder
- **Controllers**: JavaScript controllers in `controller/` folder
- **Models**: OData model binding and device models in `model/` folder

### Routing
- Single route application with `RouteView1` pattern
- Router configuration in manifest.json
- Target view: `View1` with slide transition

### Naming Conventions
- **Namespace**: `zui5recebfisic`
- **View Path**: `zui5recebfisic.view`
- **Component**: Extends `zui5recebfisic.Component`
- **Files**: Use camelCase for JavaScript, PascalCase for views

### Data Binding
- **Main Service**: OData v2 service bound to default model
- **i18n Model**: Resource bundle for internationalization
- **Device Model**: Device-specific properties and capabilities