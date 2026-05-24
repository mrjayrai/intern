# Phase 22: Reports, Analytics, Aggregations, and Export System

## Overview

Phase 22 introduces a comprehensive reporting and analytics system for the Intern Flow application. This system enables generation of detailed analytics reports with support for multiple export formats (CSV and PDF), filtering capabilities, and role-based access control.

## Architecture

### Core Components

1. **Reporting Service** (`reportingService.js`)
   - MongoDB aggregation pipelines for efficient data analysis
   - Support for multiple analytics metrics
   - Optimized queries with `allowDiskUse(true)` for large datasets

2. **Analytics Utilities** (`analyticsUtils.js`)
   - Helper functions for calculations
   - Data formatting and transformation
   - Statistical analysis functions

3. **Export Utilities**
   - **CSV Export** (`csvExportUtils.js`): Converts report data to CSV format
   - **PDF Export** (`pdfExportUtils.js`): Generates professional PDF reports using PDFKit

4. **Validators** (`reportValidator.js`)
   - Input validation for report requests
   - Filter sanitization
   - Date range and parameter validation

5. **Controller** (`reportsController.js`)
   - HTTP request handling
   - Permission checking
   - Audit logging

6. **Routes** (`reportsRoutes.js`)
   - API endpoint definitions
   - Authentication middleware

## API Endpoints

### Analytics Reports

#### GET /api/reports/overview
Get high-level overview metrics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "overview",
    "metrics": {
      "totalReferrals": 100,
      "activeInternships": 45,
      "completedInternships": 30,
      "slaBreaches": 2,
      "statusDistribution": {}
    },
    "filters": {},
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/reports/onboarding
Get onboarding funnel analytics showing progression through onboarding stages.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `status` (optional): PENDING, ACTIVE, COMPLETED, REJECTED, TERMINATED

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "onboarding",
    "funnel": [
      {
        "stage": "REFERRED",
        "count": 100,
        "percentage": 100
      },
      {
        "stage": "JOINING_FORM_PENDING",
        "count": 95,
        "percentage": 95
      }
    ]
  }
}
```

#### GET /api/reports/referrals
Get referral conversion metrics and analysis.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `department` (optional): Department name

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "referrals",
    "conversion": {
      "total": 100,
      "converted": 50,
      "rejected": 15,
      "pending": 35,
      "conversionRate": 50,
      "rejectionRate": 15
    }
  }
}
```

#### GET /api/reports/sla
Get SLA compliance and breach metrics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "sla",
    "metrics": {
      "total": 100,
      "onTime": 98,
      "breached": 2,
      "completed": 50,
      "breachRate": 2,
      "complianceRate": 98
    }
  }
}
```

#### GET /api/reports/workflows
Get workflow bottlenecks and completion metrics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `workflowStage` (optional): Specific workflow stage

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "workflows",
    "bottlenecks": [
      {
        "stage": "ACTIVE",
        "count": 45,
        "avgDaysInStage": 15.3
      }
    ],
    "completion": {
      "total": 100,
      "completed": 30,
      "active": 45,
      "terminated": 5,
      "certificateIssued": 28,
      "completionRate": 30,
      "certificateRate": 93
    }
  }
}
```

#### GET /api/reports/mentors
Get mentor performance analytics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "mentors",
    "mentors": [
      {
        "mentorId": "userId",
        "mentorName": "John Doe",
        "mentorEmail": "john@example.com",
        "totalReferrals": 25,
        "completed": 18,
        "active": 5,
        "slaBreaches": 1,
        "completionRate": 72
      }
    ]
  }
}
```

#### GET /api/reports/referrers
Get referrer performance analytics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "referrers",
    "referrers": [
      {
        "referrerId": "userId",
        "referrerName": "Jane Smith",
        "referrerEmail": "jane@example.com",
        "totalReferrals": 30,
        "completed": 15,
        "active": 10,
        "completionRate": 50
      }
    ]
  }
}
```

#### GET /api/reports/provisioning
Get access provisioning metrics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "provisioning",
    "metrics": {
      "total": 100,
      "pending": 15,
      "completed": 85,
      "delayed": 8,
      "completionRate": 85,
      "delayRate": 8
    }
  }
}
```

#### GET /api/reports/timeline
Get timeline trends (referrals and completions over time).

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `granularity` (optional): day, week, or month (default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "timeline",
    "granularity": "month",
    "trends": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "referrals": 25,
        "completed": 5
      }
    ]
  }
}
```

### Export Endpoints

#### GET /api/reports/export/csv
Export reports as CSV files.

**Query Parameters:**
- `reportType` (required): overview, onboarding, referrals, sla, workflows, completion, mentors, referrers, provisioning, detailed
- `format`: csv (default)
- Other filter parameters as needed

**Returns:** CSV file attachment

#### GET /api/reports/export/pdf
Export reports as PDF files.

**Query Parameters:**
- `reportType` (required): overview, onboarding, referrals, sla, workflows, completion, mentors, referrers, provisioning, detailed
- `format`: pdf (default)
- Other filter parameters as needed

**Returns:** PDF file attachment

## Available Filters

All report endpoints support the following optional filters:

### Date Range
- `startDate`: ISO 8601 date string (e.g., "2024-01-15")
- `endDate`: ISO 8601 date string (e.g., "2024-01-31")

### Workflow
- `workflowStage`: Any value from WORKFLOW_STAGES (e.g., ACTIVE, COMPLETED, REFERRED)

### Status
- `status`: PENDING, ACTIVE, COMPLETED, REJECTED, TERMINATED, ON_HOLD

### Other
- `department`: Department name
- `mentor`: Mentor ID
- `limit`: Max 1000 results (default: no limit)
- `offset`: Pagination offset (default: 0)
- `granularity`: day, week, month (for timeline reports)

## Examples

### Example 1: Get Overview for Last 30 Days

```bash
curl -X GET "http://localhost:3000/api/reports/overview?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Example 2: Export Mentor Analytics as CSV

```bash
curl -X GET "http://localhost:3000/api/reports/export/csv?reportType=mentors&startDate=2024-01-01" \
  -H "Authorization: Bearer <token>" \
  --output mentors.csv
```

### Example 3: Get SLA Report for Active Workflow Items

```bash
curl -X GET "http://localhost:3000/api/reports/sla?workflowStage=ACTIVE" \
  -H "Authorization: Bearer <token>"
```

### Example 4: Export Detailed Report as PDF

```bash
curl -X GET "http://localhost:3000/api/reports/export/pdf?reportType=detailed&status=COMPLETED" \
  -H "Authorization: Bearer <token>" \
  --output detailed-report.pdf
```

## Role-Based Access Control

Reports are only accessible to users with specific roles:

- **SUPER_ADMIN**: Full access to all reports
- **HR**: Full access to all reports
- **MENTOR**: Full access to all reports

All other roles will receive a 403 Forbidden response.

## Audit Logging

All report access is logged for audit purposes via the AuditLog model:

- **Action**: VIEW_REPORT or EXPORT_<format>-<reportType>
- **ResourceType**: Report
- **ResourceId**: Report type
- **Details**: Filters used and timestamp

## Data Aggregation

The reporting service uses MongoDB aggregation pipelines for efficient data processing:

### Key Aggregation Features
- **Facet aggregation**: Multiple analyses in single database pass
- **Disk usage**: AllowDiskUse(true) for large datasets
- **Lookup**: Join data from related collections
- **Group**: Aggregate metrics by stage, status, mentor, etc.
- **Match**: Filter data efficiently at database level

### Performance Considerations

1. **Use date filters**: Limit data scope with `startDate` and `endDate`
2. **Avoid large exports**: PDF exports with 1000+ records may be slow
3. **Batch operations**: Use pagination for large result sets
4. **Index usage**: Ensure collection indexes are created for common queries

## Supported Report Types

1. **overview**: High-level metrics
2. **onboarding**: Onboarding funnel progression
3. **referrals**: Referral conversion analysis
4. **sla**: SLA compliance and breaches
5. **workflows**: Bottleneck identification and completion rates
6. **completion**: Internship completion metrics
7. **mentors**: Mentor performance analytics
8. **referrers**: Referrer performance analytics
9. **provisioning**: Access provisioning metrics
10. **detailed**: Detailed candidate records

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Error Codes

- **400**: Bad Request (invalid filters or parameters)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (invalid report type)
- **500**: Internal Server Error (database or processing error)

## CSV Export Format

CSV exports include:
- Header row with column names
- Generated timestamp comment
- Proper escaping of special characters
- UTF-8 encoding

## PDF Export Format

PDF exports include:
- Formatted title and subtitle
- Generation timestamp
- Professional layout with metrics displayed in boxes
- Tables for detailed data
- Page breaks for long reports

## File Naming Convention

Exported files follow the pattern: `{timestamp}-{reportType}.{format}`

Example: `2024-01-15-mentor-analytics.csv`

## Integration with Frontend

To integrate these reports in the frontend:

1. **Import the reporting API client**
2. **Handle authentication token in headers**
3. **Display metrics in UI components**
4. **Provide filter UI for date ranges and other parameters**
5. **Implement export buttons linking to CSV/PDF endpoints**

## Future Enhancements

Potential improvements for future phases:

- Scheduled report generation and email delivery
- Custom report builder
- More granular filtering options
- Real-time dashboard updates
- Report caching for frequently accessed reports
- Multi-format export (Excel, JSON)
- Advanced visualization options
- Comparative period analysis

## Support and Maintenance

For issues or questions:
1. Check the validation errors in the API response
2. Verify user role permissions
3. Review audit logs for access history
4. Check database indexes for performance
5. Ensure proper date formats in filters
