# Integration Tests - Physical Receipt System

This directory contains comprehensive OPA5 integration tests for the Physical Receipt System (Sistema de Recebimento Físico).

## Test Structure

### Page Objects
Located in `pages/` directory, these provide reusable actions and assertions for each view:

- **MainMenu.js** - Main menu navigation and button interactions
- **PhysicalReceipt.js** - Invoice and container data entry, validation
- **CreateUC.js** - UC creation with packaging material validation
- **AssembleUC.js** - Material scanning, barcode validation, item management
- **UCVisualization.js** - UC listing, deletion, and management
- **FinalizationCheck.js** - Receipt review and goods transfer completion

### Journey Tests
Complete user workflow tests covering all requirements:

#### NavigationJourney.js
- Basic navigation between all screens
- Menu functionality and screen transitions
- Back navigation and state preservation

#### CompleteReceiptJourney.js
- End-to-end receipt processing workflow
- UC creation and assembly process
- Complete goods transfer and finalization
- **Requirements covered**: All primary workflow requirements (1.1-8.7)

#### ErrorHandlingJourney.js
- Input validation error scenarios
- Service call error handling
- Recovery mechanisms and retry logic
- **Requirements covered**: 9.5, 9.6, validation requirements

#### MobileInteractionJourney.js
- Touch-friendly interface testing
- Barcode scanner integration
- Responsive design validation
- Mobile device compatibility
- **Requirements covered**: 9.1, 9.2, 9.4

#### DataPersistenceJourney.js
- Data consistency across navigation
- State management and persistence
- Backend data integration
- UC status management
- **Requirements covered**: 10.1-10.7, data integrity requirements

#### BackendIntegrationJourney.js
- SAP service integration testing
- OData function import calls
- BAPI integration (BAPI_GOODSMVT_CREATE)
- User authorization validation
- **Requirements covered**: All backend integration requirements (10.1-10.7)

## Test Execution

### Running Tests

#### All Integration Tests
```bash
# Run complete test suite
npm run int-test
```

#### Specific Test Files
Open the following HTML files in browser:
- `opaTests.qunit.html` - Original basic tests
- `opaTestsComplete.qunit.html` - Complete comprehensive test suite

#### Mobile Testing
Use browser developer tools to simulate mobile devices:
1. Open browser developer tools (F12)
2. Toggle device toolbar
3. Select mobile device (iPhone, Android)
4. Run tests with mobile viewport

### Test Configuration

#### Environment Configuration
Tests can be configured for different environments:
- **Desktop** - Standard configuration
- **Tablet** - Medium timeout settings
- **Phone** - Extended timeout for slower interactions

#### Backend Configuration
- **Mock Data** - Fast execution with mock responses
- **Real Backend** - Integration with actual SAP services

### Test Coverage

#### Requirements Validation
All tests are mapped to specific requirements from the requirements document:

| Requirement | Test Coverage |
|-------------|---------------|
| 1.1-1.4 | NavigationJourney, CompleteReceiptJourney |
| 2.1-2.5 | PhysicalReceipt page tests, input validation |
| 3.1-3.7 | Invoice validation, receipt status checking |
| 4.1-4.6 | Header creation, operation classification |
| 5.1-5.6 | UC visualization and management |
| 6.1-6.8 | UC creation with material validation |
| 7.1-7.6 | Material scanning and UC assembly |
| 8.1-8.7 | Receipt finalization and goods transfer |
| 9.1-9.6 | Mobile UX and error handling |
| 10.1-10.7 | Backend service integration |

#### Screen Transitions
All navigation paths are tested:
```
MainMenu → PhysicalReceipt → CreateUC → AssembleUC → FinalizationCheck
         ↓                  ↓           ↓
         UCVisualization ←──┴───────────┘
```

#### User Interactions
- Form input and validation
- Button press actions
- Touch interactions
- Barcode scanning simulation
- Error dialog handling
- Confirmation popups

#### Data Scenarios
- Valid invoice processing
- Invalid data handling
- Material validation (valid/invalid)
- Barcode validation (13/14 characters)
- Quantity and expiration date handling
- UC status management

## Test Maintenance

### Adding New Tests
1. Create page objects for new views in `pages/` directory
2. Add journey tests for new workflows
3. Update `AllJourneys.js` to include new test files
4. Document requirements coverage

### Updating Existing Tests
1. Modify page objects when UI changes
2. Update assertions for new validation rules
3. Adjust timeouts for performance changes
4. Update documentation

### Best Practices
- Use descriptive test names that explain the scenario
- Include requirement references in test descriptions
- Use page objects for reusable actions
- Test both positive and negative scenarios
- Validate error messages and recovery paths
- Test mobile-specific interactions separately

## Troubleshooting

### Common Issues
1. **Timeout Errors** - Increase timeout in test configuration
2. **Element Not Found** - Check element IDs and view names
3. **Navigation Failures** - Verify routing configuration
4. **Service Errors** - Check mock data or backend connectivity

### Debug Mode
Enable OPA5 debug mode for detailed logging:
```javascript
Opa5.extendConfig({
    debugTimeout: 15,
    autoWait: true
});
```

### Performance Optimization
- Use `autoWait: true` to reduce explicit waits
- Optimize polling intervals for test environment
- Use mock data for faster test execution
- Run tests in headless mode for CI/CD

## Continuous Integration

### Test Automation
Tests are designed to run in CI/CD pipelines:
- Headless browser support
- JUnit XML output format
- Configurable timeouts and retries
- Environment-specific configurations

### Quality Gates
- All tests must pass before deployment
- Coverage requirements for new features
- Performance benchmarks for test execution
- Mobile compatibility validation