# Reports API Quick Reference

## Base URL
```
/api/reports
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <JWT_TOKEN>
```

## Report Endpoints

| Endpoint | Method | Purpose | Key Filters |
|----------|--------|---------|------------|
| `/overview` | GET | High-level metrics | dateRange |
| `/onboarding` | GET | Onboarding funnel | dateRange, status |
| `/referrals` | GET | Conversion metrics | dateRange, department |
| `/sla` | GET | SLA compliance | dateRange |
| `/workflows` | GET | Bottlenecks & completion | dateRange, workflowStage |
| `/mentors` | GET | Mentor performance | dateRange |
| `/referrers` | GET | Referrer performance | dateRange |
| `/provisioning` | GET | Access provisioning | dateRange |
| `/timeline` | GET | Trends over time | dateRange, granularity |
| `/export/csv` | GET | CSV export | reportType, dateRange |
| `/export/pdf` | GET | PDF export | reportType, dateRange |

## Common Filter Patterns

### Date Range Filter
```
?startDate=2024-01-01&endDate=2024-01-31
```

### Status Filter
```
?status=COMPLETED
```

### Workflow Stage Filter
```
?workflowStage=ACTIVE
```

### Multiple Filters
```
?startDate=2024-01-01&endDate=2024-01-31&status=COMPLETED&workflowStage=ACTIVE
```

## Export Examples

### Export Overview as CSV
```
GET /api/reports/export/csv?reportType=overview&startDate=2024-01-01
```

### Export Mentors as PDF
```
GET /api/reports/export/pdf?reportType=mentors
```

### Export Detailed Report with Filters
```
GET /api/reports/export/csv?reportType=detailed&status=COMPLETED&startDate=2024-01-01
```

## Response Structure

### Success Response
```json
{
  "success": true,
  "data": {
    "reportType": "string",
    "metrics": {},
    "filters": {},
    "generatedAt": "ISO8601"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Roles Allowed
- superAdmin
- hr
- mentor

## Performance Tips

1. **Always use date filters** for historical data
2. **Limit large exports** to last 90 days
3. **Use CSV for large datasets** (faster than PDF)
4. **Batch timeline requests** by month/week
5. **Cache frequent reports** in frontend

## File Paths

- Service: `/src/services/reportingService.js`
- Controller: `/src/controllers/reportsController.js`
- Routes: `/src/routes/reportsRoutes.js`
- Validators: `/src/validators/reportValidator.js`
- Utils: `/src/utils/{analyticsUtils, csvExportUtils, pdfExportUtils}.js`

## Common Use Cases

### Get Total Internship Count
```
GET /api/reports/overview
// Response: data.metrics.totalReferrals
```

### Check Onboarding Progress
```
GET /api/reports/onboarding
// Response: data.funnel (array of stages with counts)
```

### Monitor SLA Compliance
```
GET /api/reports/sla
// Response: data.metrics.complianceRate
```

### Identify Workflow Issues
```
GET /api/reports/workflows
// Response: data.bottlenecks (sorted by avgDaysInStage)
```

### Evaluate Mentor Performance
```
GET /api/reports/mentors
// Response: data.mentors (sorted by totalReferrals)
```

### Download Data Backups
```
GET /api/reports/export/csv?reportType=detailed
// Returns: detailed-report.csv file
```

## Known Limitations

1. PDF export limited to first 30 rows for detailed reports
2. Date filters use UTC timezone
3. No real-time updates (data generated at request time)
4. Maximum limit of 1000 for pagination
5. Export files not cached (generated fresh each time)

## Troubleshooting

### 403 Forbidden
- Check user role (must be superAdmin, hr, or mentor)
- Verify authentication token is valid

### 400 Bad Request
- Validate date format (YYYY-MM-DD)
- Check status/stage values are valid
- Ensure limit is between 1-1000

### 500 Server Error
- Check database connection
- Review server logs
- Ensure collection indexes exist
- Verify available disk space for aggregations

## Integration Checklist

- [ ] Add reports UI to dashboard
- [ ] Create filter component for date ranges
- [ ] Add export buttons for CSV/PDF
- [ ] Display metrics in card components
- [ ] Add mentor/referrer analytics views
- [ ] Implement timeline visualization
- [ ] Add funnel chart for onboarding
- [ ] Create report caching mechanism
- [ ] Add audit log viewing interface
- [ ] Setup scheduled report generation
