# Requirements Document

## Introduction

This specification defines the requirements for a comprehensive Physical Receipt System (Sistema de Recebimento Físico) for warehouse management. The system will be implemented as an SAP Fiori application that manages the physical receipt process of goods, including invoice validation, container/truck identification, UC (Unit of Commerce) creation and management, material scanning, and goods transfer operations.

The system integrates with SAP EWM (Extended Warehouse Management) and provides a mobile-friendly interface for warehouse operators to efficiently process physical receipts with barcode scanning capabilities.

## Requirements

### Requirement 1 - Main Menu Navigation

**User Story:** As a warehouse operator, I want to access the main menu with clear navigation options, so that I can quickly start the appropriate receipt process.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display the main menu with "Recebimento" and "Armazenar UC" options
2. WHEN I select "Recebimento" THEN the system SHALL navigate to the physical receipt screen
3. WHEN I select "Armazenar UC" THEN the system SHALL navigate to the UC storage screen
4. WHEN I select "Voltar" THEN the system SHALL provide appropriate navigation or exit functionality

### Requirement 2 - Physical Receipt Data Entry

**User Story:** As a warehouse operator, I want to enter invoice and container/truck identification data, so that I can initiate the physical receipt process.

#### Acceptance Criteria

1. WHEN I access the receipt screen THEN the system SHALL provide input fields for "NF" (Invoice) and "Identificador" (Container/Truck ID)
2. WHEN I enter data in the fields THEN the system SHALL validate the input format
3. WHEN I access the screen THEN the system SHALL display action buttons: "Ocorrência", "Início", "Concluir", "Montar UC", and "Visualizar UCs"
4. WHEN I click "Início" THEN the system SHALL return to the main menu
5. WHEN I click "Ocorrência" THEN the system SHALL navigate to the occurrence registration screen

### Requirement 3 - Invoice and Receipt Validation

**User Story:** As a warehouse operator, I want the system to validate invoice data and receipt status, so that I can ensure data integrity and avoid duplicate processing.

#### Acceptance Criteria

1. WHEN I click "Concluir" or "Montar UC" THEN the system SHALL validate that NF and Identificador fields are filled
2. WHEN validation passes THEN the system SHALL check if the invoice exists in J_1BNFDOC table using DOCNUM field
3. IF the invoice is not found THEN the system SHALL display "Nota não encontrada" message
4. WHEN the invoice exists THEN the system SHALL check if the NF+Identificador combination exists in Header table
5. IF the combination exists AND StatusReceb equals "CONCLUIDO" THEN the system SHALL display "Recebimento concluído" message
6. IF the combination exists AND there is a UC with status "EM ABERTO" THEN the system SHALL navigate to "Montar UC" screen with existing UC
7. IF no open UC exists THEN the system SHALL create a new UC and navigate to "Criar UC" screen

### Requirement 4 - Receipt Type Classification and Header Creation

**User Story:** As a warehouse operator, I want the system to automatically classify receipt types and create header records, so that the receipt process is properly categorized and tracked.

#### Acceptance Criteria

1. WHEN NF+Identificador combination doesn't exist in Header table THEN the system SHALL determine if it's "Importação" or "Normal" operation
2. WHEN the combination exists in the NF-Container mapping table THEN the system SHALL classify as "Importação"
3. WHEN the combination doesn't exist in the mapping table THEN the system SHALL classify as "Normal"
4. WHEN classification is complete THEN the system SHALL create Header record with: NF, Identificador, Operação (Importação/Normal), StatusReceb="Inicial", StatusContainer="Inicial"
5. IF "Concluir" was selected THEN the system SHALL return to main menu after header creation
6. IF "Montar UC" was selected THEN the system SHALL proceed to UC creation process

### Requirement 5 - UC Visualization and Management

**User Story:** As a warehouse operator, I want to view and manage existing UCs for a receipt, so that I can track progress and delete UCs when necessary.

#### Acceptance Criteria

1. WHEN I click "Visualizar UCs" THEN the system SHALL display all UCs for the current NF+Identificador combination from Items table
2. WHEN UCs are displayed THEN the system SHALL show UC numbers in a list format
3. WHEN viewing UCs THEN the system SHALL provide "Início", "Montar UC", and "Finalizar Recebimento" buttons
4. WHEN I select a UC THEN the system SHALL provide delete functionality with appropriate validation
5. WHEN I click "Montar UC" THEN the system SHALL navigate to UC assembly screen
6. WHEN I click "Finalizar Recebimento" THEN the system SHALL navigate to receipt finalization process

### Requirement 6 - Packaging Material Validation and UC Creation

**User Story:** As a warehouse operator, I want to specify packaging material for UC creation, so that the system can create proper handling units.

#### Acceptance Criteria

1. WHEN I access "Criar UC" screen THEN the system SHALL display NF and Identificador as read-only fields
2. WHEN I access the screen THEN the system SHALL provide input field for "Mat. Embalagem" (Packaging Material)
3. WHEN I enter packaging material THEN the system SHALL validate the material exists in /SAPAPO/MATKEY table using MATNR field
4. IF material doesn't exist THEN the system SHALL display "Material de embalagem não cadastrado no SAP" message
5. WHEN material exists THEN the system SHALL retrieve MATID from /SAPAPO/MATKEY and HUTYP from /SAPAPO/MATPACK
6. WHEN validation passes THEN the system SHALL call UC creation function with material and type information
7. WHEN UC is created successfully THEN the system SHALL display "UC 'XXXXXX' criada" message and navigate to "Montar UC" screen
8. IF UC creation fails THEN the system SHALL display the error message and allow retry

### Requirement 7 - Material Scanning and UC Assembly

**User Story:** As a warehouse operator, I want to scan materials and specify quantities to assemble UCs, so that I can accurately record received items.

#### Acceptance Criteria

1. WHEN I access "Montar UC" screen THEN the system SHALL display NF, Identificador, and UC as read-only fields
2. WHEN I access the screen THEN the system SHALL provide input fields for "Material", "Quantidade", and conditionally "Validade"
3. WHEN I scan a barcode THEN the system SHALL accept 13 or 14 character codes and validate using existing ABAP logic
4. WHEN material requires expiration date THEN the system SHALL display month and year selection fields
5. WHEN I add an item THEN the system SHALL create a record in Items table with: NF, UC, ItemUc (sequential), Identificador, DataValidade, Material13, Material14, Material (SAP SKU), Quantidade
6. WHEN I click "Concluir UC" THEN the system SHALL show confirmation popup and update StatusUC to "CONCLUIDO" and Header StatusContainer to "EM ANDAMENTO"
7. WHEN I click "Finalizar Recebimento" THEN the system SHALL navigate to finalization check screen

### Requirement 8 - Receipt Finalization and Transfer

**User Story:** As a warehouse operator, I want to review and finalize receipts with automatic goods transfer, so that materials are properly moved to their designated locations.

#### Acceptance Criteria

1. WHEN I access finalization screen THEN the system SHALL display NF, Identificador, and all scanned materials with quantities
2. WHEN I review the data THEN the system SHALL provide "Voltar" and "Concluir" buttons
3. WHEN I click "Voltar" THEN the system SHALL return to "Montar UC" screen
4. WHEN I click "Concluir" THEN the system SHALL execute goods transfer using BAPI_GOODSMVT_CREATE
5. IF transfer succeeds THEN the system SHALL display "Recebimento efetivado" message, update Header StatusContainer to "CONCLUÍDO", and set StatusNãoValorado to "Sucesso"
6. IF transfer fails THEN the system SHALL display BAPI error message and set StatusNãoValorado to "ERRO"
7. WHEN StatusNãoValorado is "ERRO" THEN the system SHALL allow return to screen 4 for reprocessing

### Requirement 9 - System Navigation and User Experience

**User Story:** As a warehouse operator, I want intuitive navigation and responsive design, so that I can efficiently use the application on mobile devices.

#### Acceptance Criteria

1. WHEN using the application THEN the system SHALL provide consistent navigation patterns across all screens
2. WHEN on any screen THEN the system SHALL display appropriate back/cancel options
3. WHEN data entry is in progress THEN the system SHALL warn before losing unsaved changes
4. WHEN using mobile devices THEN the system SHALL provide touch-friendly interface elements
5. WHEN errors occur THEN the system SHALL display clear, actionable error messages
6. WHEN operations complete successfully THEN the system SHALL provide clear confirmation messages

### Requirement 10 - Data Integration and Backend Services

**User Story:** As a system administrator, I want the application to integrate properly with SAP backend services, so that data consistency is maintained across systems.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL validate user authorization using ValidarUsuarioCentro function
2. WHEN creating UCs THEN the system SHALL use CriarUC function with proper parameters
3. WHEN completing UCs THEN the system SHALL use ConcluirUC function
4. WHEN deleting UCs THEN the system SHALL use DeletarUC function with proper validation
5. WHEN validating materials THEN the system SHALL access SAP material master data
6. WHEN transferring goods THEN the system SHALL use configured depot mapping from ZEWMTRANSF table
7. WHEN processing barcodes THEN the system SHALL use existing ABAP validation logic for 13/14 character codes