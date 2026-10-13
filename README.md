# Indosaticrm

# MASTER PROMPT: BUILD A COMPLETE GeM SELLER CRM PLATFORM FOR INDOSATI

## 1. Project Overview

Build a professional, secure, responsive, and fully functional **GeM Seller Order Management CRM** for INDOSATI Instruments & Chemicals.

The CRM will be used to manage all orders received through the Government e-Marketplace (GeM), starting from order generation and continuing through product preparation, dispatch, delivery, CRAC generation, payment receipts, and final payment settlement.

The primary objective is to maintain all GeM order records in one centralized database, automate dispatch deadline reminders through SMS, calculate outstanding payments automatically, and synchronize all records with Google Sheets.

This must be a working business application, not just a UI prototype or dashboard with dummy data.

## 2. Main Objectives

The CRM must provide the following capabilities:

1. Record every new GeM order and its generation date.
2. Track the last date for dispatch specified in the order.
3. Automatically send an SMS reminder at least 5 days before the dispatch deadline.
4. Maintain complete buyer, product, quantity, order value, and address details.
5. Record the actual dispatch date and transportation details.
6. Track delivery and the date the buyer receives the product.
7. Maintain the CRAC generation status and CRAC date.
8. Track every payment received against an order, including partial payments.
9. Automatically calculate the total amount received and outstanding balance.
10. Store all information in a permanent database.
11. Automatically synchronize records with Google Sheets.
12. Display pending dispatches, upcoming deadlines, pending CRACs, delayed payments, and outstanding balances.
13. Generate searchable reports and export records to Excel or CSV.
14. Provide an easy-to-use interface for daily business operations.

## 3. Main Navigation and Application Modules

Create the following modules in the sidebar:

* Dashboard
* GeM Orders
* Add New Order
* Dispatch Management
* CRAC Management
* Payment Management
* Buyer Directory
* Transport & Tracking
* SMS Reminders
* Reports & Analytics
* Google Sheets Integration
* Settings & User Management

The interface must be clean, professional, fast, and optimized for desktop computers, with responsive layouts for mobile phones and tablets.

## 4. GeM Order Master Database

Create a dedicated order database containing the following fields.

### A. Order Information

* Internal CRM Order ID — automatically generated and unique.
* GeM Order Number — mandatory, unique where applicable.
* GeM Contract or Purchase Order Reference.
* Order Generation Date — the date the order is generated on GeM.
* Last Date for Dispatch — the deadline specified in the GeM order.
* Order Status.
* Assigned Employee or Responsible Person.
* Date the record was created in the CRM.
* Date the record was last updated.
* Remarks and Internal Notes.
* Attachments — purchase order PDF, GeM documents, and other relevant files.

### B. Buyer Information

Maintain the complete buyer details associated with each order:

* Buyer or Organization Name.
* Department or Ministry.
* Organization Type.
* Buyer Contact Person.
* Buyer Mobile Number.
* Buyer Email Address.
* Complete Billing Address.
* Complete Delivery Address.
* City.
* District.
* State.
* PIN Code.
* Additional Contact Details.
* Buyer Remarks.

Create a buyer directory so that previously entered buyers can be selected for new orders without entering all their information again.

### C. Product and Order Value Information

For every order, capture:

* Product Name.
* Product Code or SKU.
* Product Description.
* Ordered Quantity.
* Unit of Measurement.
* Unit Price.
* Total Product Value.
* Applicable Taxes, if required.
* Additional Charges, if applicable.
* Final GeM Order Value.

Allow multiple products within a single GeM order.

Each order must support an itemized product table. Calculate the total order value from the relevant item amounts and charges, with an option to verify or override it against the official GeM order value, subject to permissions.

The official GeM order value must be clearly identifiable and used as the basis for payment balance calculations.

## 5. Automatic Dispatch Deadline Management

This is one of the most important features of the CRM.

Every order must have an order generation date and a last dispatch date.

Create automatic deadline monitoring with the following behavior:

* Calculate the dispatch deadline from the date entered for the GeM order.
* Automatically calculate the reminder date as 5 calendar days before the dispatch deadline.
* Send an SMS reminder on the calculated reminder date.
* Also show upcoming dispatch deadlines on the dashboard.
* Provide additional reminders for overdue orders.
* Mark orders as dispatched only when the actual dispatch information is recorded.
* Stop future dispatch reminders when the order has been dispatched or cancelled.
* Allow authorized users to configure reminder timing, including a 5-day minimum advance reminder.
* Handle weekends and holidays according to the configured reminder policy.
* Record each reminder's scheduled date, sent date, delivery status, and error message if applicable.

Example:

If the last dispatch date is 20 November 2026, the CRM should schedule the advance SMS reminder for 15 November 2026.

If the system is configured to send reminders at 10:00 AM, it should process the reminder automatically at that time.

The system must use a scheduled background job or equivalent reliable automation. It must not depend on a user opening the dashboard.

If the reminder date has already passed when an order is entered, flag it for immediate attention instead of silently scheduling an incorrect reminder.

### SMS Message Template

Create an editable SMS template similar to the following:

"INDOSATI ALERT: GeM Order {GeM_Order_Number} for {Buyer_Name} must be dispatched by {Dispatch_Deadline}. Only 5 days remain. Product: {Product_Name}. Please arrange dispatch in time."

For orders with multiple products, use a concise order-level message.

Integrate a configurable SMS gateway that supports India and permits transactional or business messaging as applicable. Store API credentials securely on the server.

Provide SMS configuration, message templates, delivery logs, retry handling, and test-message functionality.

Do not display a message as successfully sent unless the SMS provider confirms acceptance. Where delivery receipts are available, track the actual delivery status separately.

## 6. Dispatch Management

Create a dedicated dispatch form linked to the relevant GeM order.

Record the following information:

* GeM Order Number.
* Product or Products Dispatched.
* Quantity Dispatched.
* Dispatch Date — the actual date the product leaves INDOSATI.
* Dispatch Status.
* Transporter or Courier Company Name.
* Transport Mode.
* Docket Number, Consignment Number, or Transporter ID.
* LR Number or GR Number, where applicable.
* Vehicle Number, where applicable.
* E-way Bill Number, where applicable.
* Invoice Number.
* Invoice Date.
* Invoice Amount.
* Expected Delivery Date.
* Actual Buyer Receipt Date.
* Proof of Dispatch Attachment.
* Transport Receipt Attachment.
* Invoice Attachment.
* Remarks.

Allow multiple dispatch entries against one GeM order so that partial dispatches can be recorded without losing the original order details.

The system should calculate pending dispatch quantity when an order is dispatched in multiple shipments.

The dispatch date must remain distinct from the buyer's actual receipt date.

Provide a dispatch status workflow:

* Pending Dispatch
* Dispatch Due Soon
* Dispatch Overdue
* Partially Dispatched
* Fully Dispatched
* Delivered
* Cancelled

Update statuses automatically where possible, while allowing authorized users to make controlled corrections.

## 7. Buyer Delivery Tracking

Once an order is dispatched, track its delivery progress.

Maintain:

* Dispatch Reference.
* Transporter Name.
* Docket or Tracking Number.
* Dispatch Date.
* Expected Delivery Date.
* Actual Delivery Date.
* Buyer Received Date.
* Delivery Confirmation Status.
* Proof of Delivery.
* Delivery Remarks.

Allow multiple shipments for one order and record delivery separately for each shipment.

Do not automatically assume that an order is delivered merely because its expected delivery date has passed.

Where transporter API integration is available, allow shipment tracking integration. Otherwise, provide manual status updates.

## 8. CRAC Management

Create a separate CRAC tracking module linked to each GeM order and its relevant invoice or shipment.

The CRM must track the CRAC stage of the GeM payment process.

Include the following fields:

* GeM Order Number.
* Invoice Number.
* Dispatch Reference.
* Buyer Name.
* CRAC Status.
* CRAC Generation Date.
* CRAC Reference Number.
* CRAC Document Attachment.
* Remarks.
* Follow-up Date.

Create the following CRAC statuses:

* Dispatch Not Completed
* Awaiting Buyer Receipt
* Delivered — CRAC Pending
* CRAC Generated
* CRAC Issue or Clarification Required

The CRAC generation date must be entered or imported from a verified source. Do not assume CRAC has been generated merely because the product is delivered.

For orders containing multiple invoices or shipments, allow CRAC records to be maintained against the applicable invoice or shipment.

Display pending CRACs prominently on the dashboard so that the responsible employee can follow up.

## 9. Payment Management and Automatic Balance Calculation

Build a dedicated payment management module that follows the order's payment lifecycle.

### A. Payment Stages

Track these stages:

1. GeM Order Received.
2. Product Dispatched.
3. Product Delivered.
4. CRAC Awaited.
5. CRAC Generated.
6. Payment Awaited.
7. Part Payment Received.
8. Full Payment Received.
9. Payment Reconciliation Required.

These statuses must be maintained separately from actual financial transactions. The CRM should not mark an order as paid simply because it has reached a particular stage.

### B. CRAC Record

Maintain:

* CRAC Status.
* CRAC Number.
* CRAC Generation Date.
* CRAC Amount, if applicable.
* CRAC Document.
* Remarks.

### C. Payment Receipt Record

Every time a payment is received, record a separate transaction with:

* GeM Order Number.
* Invoice Number or Reference.
* CRAC Reference, where applicable.
* Payment Transaction ID or Bank Reference.
* Payment Received Date.
* Amount Received.
* Payment Method.
* Bank or Account Reference, if needed.
* Payment Remarks.
* Supporting Document or Bank Advice Attachment.

Payment method options may include:

* Bank Transfer.
* NEFT.
* RTGS.
* IMPS.
* Other.

Allow multiple payments against the same order. Never overwrite an earlier payment when a new payment is entered.

### D. Automatic Payment Calculation

Create the following calculated fields:

**Total Order Value**

The verified official GeM order value.

**Total Amount Received**

The sum of all valid payment receipts associated with that order, excluding reversed or cancelled transactions.

**Outstanding Balance**

Outstanding Balance = Total Order Value − Total Amount Received

Example:

| Payment Detail          |    Amount |
| ----------------------- | --------: |
| Total GeM Order Value   | ₹1,00,000 |
| First Payment Received  |   ₹40,000 |
| Second Payment Received |   ₹25,000 |
| Total Amount Received   |   ₹65,000 |
| Outstanding Balance     |   ₹35,000 |

These values must be calculated automatically and updated immediately whenever a payment is added, corrected, or reversed.

Do not permit the user to manually edit the calculated balance.

If the total amount received exceeds the order value, show the excess as an overpayment or reconciliation warning instead of hiding the difference.

For cancellations, credit notes, deductions, or other financial adjustments, maintain separate adjustment entries and include them in a clearly defined net receivable calculation.

The official order value, amount received, and outstanding balance must be visible on the order detail page and dashboard.

### E. Payment Follow-Up

Provide automatic monitoring of:

* Orders awaiting CRAC generation.
* CRAC generated but payment not received.
* Partially paid orders.
* Outstanding balances.
* Orders with no payment recorded.
* Orders with payments received but not fully reconciled.

Allow configurable follow-up dates and optional email or SMS reminders to the internal team.

Do not represent the calculated expected payment date as an official GeM payment commitment unless the date has been verified.

## 10. Dashboard and Business Overview

Build a professional dashboard displaying live data from the database.

### Dashboard KPI Cards

* Total GeM Orders.
* Orders Received This Month.
* Total Order Value.
* Total Amount Dispatched.
* Orders Awaiting Dispatch.
* Dispatch Deadlines Within 5 Days.
* Overdue Dispatch Orders.
* Orders Awaiting Delivery.
* Delivered Orders Awaiting CRAC.
* Total Amount Received.
* Total Outstanding Payment.
* Partially Paid Orders.
* Fully Paid Orders.

All cards must be clickable and open the relevant filtered order list.

### Dashboard Tables

Create separate tables for:

1. Upcoming Dispatch Deadlines.
2. Overdue Dispatches.
3. Recent GeM Orders.
4. Recently Dispatched Orders.
5. Delivered Orders Awaiting CRAC.
6. CRAC Generated but Payment Pending.
7. Partially Paid Orders.
8. Orders with Outstanding Balances.
9. Recent Payment Receipts.
10. Recent SMS Notifications.

Use clear status indicators and date-based sorting.

Provide date filters for today, this week, this month, the previous month, and a custom date range.

## 11. Google Sheets Integration and Automatic Database Synchronization

I want all CRM records to be stored permanently in a real database and automatically reflected in Google Sheets, similar to maintaining my business records in a spreadsheet.

Implement a secure Google Sheets integration using Google OAuth or an appropriate Google service account with the minimum required permissions.

The primary database must remain the source of truth. Google Sheets must act as a synchronized reporting and recordkeeping layer.

### Required Google Sheets Structure

Create or connect a Google spreadsheet named:

**INDOSATI — GeM Seller CRM Master Register**

Organize the spreadsheet into these tabs:

1. Order Master
2. Order Items
3. Buyer Master
4. Dispatch Records
5. Delivery Tracking
6. CRAC Records
7. Payment Records
8. SMS Logs
9. Dashboard Summary

### Synchronization Requirements

* When a new order is created in the CRM, automatically create or update the corresponding spreadsheet row.
* When buyer details are changed, synchronize the updated information.
* When dispatch details are entered, synchronize dispatch records.
* When delivery or CRAC information is updated, synchronize the corresponding records.
* When a payment is received, append a payment transaction and update the order-level financial summary.
* Recalculate or refresh the dashboard summary.
* Use stable internal record IDs to prevent duplicate rows.
* Support initial synchronization of existing records.
* Maintain synchronization timestamps and error logs.
* Automatically retry temporary synchronization failures.
* Provide a manual Sync Now button.
* Display the last successful synchronization time.
* Provide a Sync Error status when a record cannot be synchronized.
* Allow administrators to retry failed records.

Use an idempotent synchronization process so that retries do not create duplicate orders or payment transactions.

Keep a unique identifier for every order, shipment, CRAC record, and payment transaction.

Avoid creating circular update loops between Google Sheets and the CRM.

Initially, allow one-way synchronization from the CRM to Google Sheets. If two-way synchronization is later enabled, define conflict-resolution rules and maintain a complete audit trail.

Do not store Google access tokens, service account private keys, or other secrets in frontend code or publicly accessible spreadsheet cells.

## 12. Database Architecture

Use a relational database suitable for a production web application, such as PostgreSQL.

Create linked database tables for:

* Users
* Buyers
* Orders
* Order Items
* Dispatches
* Dispatch Items
* Delivery Records
* CRAC Records
* Payment Transactions
* Financial Adjustments
* SMS Notifications
* Transporters
* Attachments
* Audit Logs
* Google Sheets Sync Logs
* Application Settings

Use primary keys, foreign keys, unique constraints, appropriate indexes, and timestamps.

The data model must support one buyer with multiple orders, one order with multiple products, one order with multiple dispatches, multiple CRAC records where needed, and multiple payment receipts.

Use database transactions to ensure payment calculations and linked updates remain consistent.

Maintain the original order value and a history of authorized changes.

## 13. Search, Filtering, and Reports

Provide global search across:

* GeM Order Number.
* Buyer Name.
* Product Name.
* Buyer Contact Number.
* Buyer Email.
* Invoice Number.
* CRAC Number.
* Docket or Consignment Number.
* Payment Transaction Reference.

Provide filters for:

* Order Generation Date.
* Dispatch Deadline.
* Dispatch Status.
* Buyer.
* Product.
* State.
* Transporter.
* Delivery Status.
* CRAC Status.
* Payment Status.
* Outstanding Balance.
* Order Value.

Generate reports for:

* Monthly GeM Orders.
* Orders by Buyer.
* Orders by Product.
* Dispatch Performance.
* Delayed Dispatches.
* CRAC Pending Report.
* Payment Received Report.
* Outstanding Payment Report.
* Buyer-Wise Outstanding Report.
* Month-Wise Revenue and Collections.
* SMS Reminder Report.

Allow export to Excel-compatible XLSX and CSV, and print-friendly PDF reports.

## 14. User Interface and Design

Create a premium, modern business CRM design with the following characteristics:

* Professional INDOSATI branding.
* Clean navigation sidebar.
* Easy-to-read tables.
* Search and filter bars.
* Dashboard cards with concise information.
* Clear date formats in DD-MM-YYYY.
* Currency displayed in Indian Rupees (₹).
* Responsive layout.
* Fast order entry.
* Inline validation.
* Confirmation messages for successful saves.
* Helpful error messages.
* Loading indicators.
* Pagination for large datasets.
* Easy access to attachments and order history.

Provide an Add New Order form divided into logical sections:

1. Order Details.
2. Buyer Details.
3. Product Details.
4. Dispatch Details.
5. CRAC Details.
6. Payment Details.
7. Attachments and Remarks.

Do not force users to enter dispatch, CRAC, or payment information when creating a new order if those stages have not yet occurred.

Allow saving partially completed records and updating them later.

## 15. User Roles, Security, and Data Protection

Create role-based access control:

**Administrator**

* Full access.
* Manage users, integrations, and settings.
* Edit and correct all records.
* View audit logs and financial reports.

**Order Manager**

* Create and update orders.
* Manage buyers, dispatches, delivery, and CRAC.

**Accounts Manager**

* Record payment receipts.
* Manage payment reconciliation.
* View financial reports.

**Viewer**

* Read-only access to authorized records and reports.

Implement:

* Secure authentication.
* Strong password handling.
* Role-based permissions.
* Server-side validation.
* Protection against unauthorized access.
* Secure secret storage.
* Audit logs for critical changes.
* Automatic database backups.
* Data export and recovery procedures.
* Session management.
* Protection against duplicate financial transactions.

Never expose confidential buyer information or integration credentials to unauthorized users.

## 16. Automation and Background Jobs

Implement reliable background jobs for:

* Daily dispatch deadline checks.
* SMS reminder scheduling.
* Overdue order alerts.
* Payment follow-up reminders.
* Google Sheets synchronization.
* Failed synchronization retries.
* Notification logs and system health monitoring.

Each job must record its execution time, outcome, and errors.

Prevent duplicate SMS messages and duplicate payment records through unique job identifiers, idempotency keys, and appropriate database constraints.

Provide a notification settings page to configure reminder time, message templates, recipients, and permitted notification channels.

## 17. Technical Implementation

Build a full-stack application using a modern framework, for example:

* Frontend: React or Next.js with TypeScript.
* UI: Tailwind CSS or an equivalent professional component system.
* Database: PostgreSQL.
* Backend: Secure server-side API or server functions.
* Authentication: Secure session-based authentication or a suitable managed authentication provider.
* Google Sheets: Google Sheets API with authorized credentials.
* SMS: Configurable SMS gateway supporting Indian business messaging.
* Background Processing: Scheduled jobs or a reliable job queue.
* File Storage: Private storage for invoices, CRAC documents, purchase orders, and delivery receipts.
* Deployment: A secure production hosting environment with HTTPS.

The final technology stack may be adapted to the selected AI app builder, but all required functionality must remain available.

Do not expose API keys in browser code. Use environment variables or a secure secrets manager.

Do not use browser local storage as the permanent database.

## 18. Testing and Acceptance Criteria

Before declaring the application complete, test the following scenarios:

**Test 1: Create an Order**

Create a GeM order with a buyer, product, quantity, order value, order date, and dispatch deadline. Confirm that the order is saved permanently and appears in the dashboard and Google Sheets.

**Test 2: Dispatch Reminder**

Create an order with a dispatch deadline of 20 November 2026. Confirm that the CRM calculates 15 November 2026 as the 5-day advance reminder date and schedules the SMS correctly.

Test that the SMS gateway sends the message, records the provider response, and does not send duplicate reminders.

**Test 3: Dispatch Tracking**

Record the actual dispatch date, transporter name, docket number, and invoice details. Confirm that dispatch records are saved and synchronized.

**Test 4: Delivery Tracking**

Enter the actual buyer receipt date and verify that the delivery status is updated without overwriting the original dispatch date.

**Test 5: CRAC Management**

Record the CRAC number and generation date. Confirm that the CRAC status is updated and the pending CRAC dashboard reflects the change.

**Test 6: Partial Payments**

Create an order worth ₹1,00,000 and record payments of ₹40,000 and ₹25,000.

Expected results:

* Total Order Value: ₹1,00,000.
* Total Amount Received: ₹65,000.
* Outstanding Balance: ₹35,000.

Confirm that the values update automatically and that both payment transactions remain individually accessible.

**Test 7: Google Sheets Synchronization**

Create and update orders, dispatch records, CRAC records, and payment transactions. Confirm that synchronization works, failed operations can be retried, and duplicate records are not created.

**Test 8: Security**

Verify that unauthorized users cannot edit payment records or access restricted buyer information.

**Test 9: Backup and Recovery**

Verify that the database can be backed up and restored without losing orders, dispatch records, CRAC information, or payment transactions.

## 19. Final Deliverables

Deliver a fully working GeM Seller CRM with:

* Functional frontend.
* Working backend.
* Configured database schema.
* User authentication and roles.
* Complete order management.
* Automated dispatch deadline monitoring.
* SMS gateway integration.
* Dispatch and delivery tracking.
* CRAC tracking.
* Multiple payment records per order.
* Automatic balance calculation.
* Google Sheets synchronization.
* Searchable dashboard and reports.
* File attachments.
* Error handling and audit logs.
* Database backup support.
* Deployment instructions.
* Environment variable documentation.
* Setup instructions for Google Sheets and the SMS provider.
* Test results and an administrator guide.

## 20. Important Build Instructions

Build this application in functional stages, starting with the database, authentication, order management, and dashboard. Then implement dispatch monitoring, CRAC management, payments, Google Sheets synchronization, SMS automation, reporting, and security testing.

Do not create only static pages or buttons that do nothing. Every form, table, search field, status update, calculation, integration, and report must work.

Do not use dummy data as if it were real business information. Sample data may be provided for testing but must be clearly identified and removable.

If Google credentials, SMS gateway credentials, or deployment permissions are not yet available, build the integration configuration and connection-testing screens, clearly identify the setup requirements, and never claim that the integration is operational until it has been tested successfully.

Prioritize accurate records, dependable reminders, transparent payment calculations, secure storage, and simple day-to-day usability.

The final result should function as INDOSATI's centralized GeM order-to-payment management system, reducing manual work and helping ensure that no dispatch deadline, CRAC follow-up, payment receipt, or outstanding balance is missed.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://indosaticrm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/27b0563f-26f7-4133-884d-b482c0b7cd14).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
