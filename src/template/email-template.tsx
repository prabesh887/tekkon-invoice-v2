import { SalaryRow } from "@/types/types"

function emailTemplate(userData: SalaryRow) {
  console.log("🚀 ~ emailTemplate ~ userData:", userData)
  return `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tekkon Pay Slip - ${userData.month} - ${userData.nameOfTheEmployee}</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, h1, h2, h3, h4, h5, h6 {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            vertical-align: baseline;
        }
        body {
            background-color: #f5f7fa;
            margin: 0;
            padding: 20px 0;
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            display: block;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header {
            background-color: #ff9900;
            padding: 30px 40px;
            text-align: center;
        }
        .header-title {
            font-size: 28px;
            color: #ffffff;
            font-weight: 600;
            margin: 15px 0 10px;
        }
        .header-subtitle {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 400;
            line-height: 1.4;
        }
        .logo {
            width: 70px;
            height: 70px;
            margin: 0 auto 15px;
            background-color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo-inner {
            width: 50px;
            height: 50px;
            background-color: #ff9900;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            padding: 40px;
            color: #333333;
            line-height: 1.6;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            padding-bottom: 15px;
            margin-bottom: 25px;
            border-bottom: 2px solid #ff9900;
            display: flex;
            align-items: center;
        }
        .section-title i {
            margin-right: 10px;
            color: #ff9900;
        }
        .employee-info {
            margin-bottom: 30px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eeeeee;
        }
        .info-table tr:last-child td {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #555555;
            width: 40%;
        }
        .info-value {
            color: #333333;
            font-weight: 500;
        }
        .salary-section {
            margin: 30px 0;
        }
        .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .salary-table th {
            background-color: #fff8e6;
            color: #e68a00;
            font-weight: 600;
            padding: 12px 15px;
            text-align: left;
            border-bottom: 2px solid #ff9900;
        }
        .salary-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eeeeee;
        }
        .salary-table tr:last-child td {
            border-bottom: none;
        }
        .earnings-row {
            background-color: #fffbf2;
        }
        .deductions-row {
            background-color: #fff5e6;
        }
        .highlight-row {
            background-color: #fffaeb;
            font-weight: 600;
        }
        .net-salary-row {
            background-color: #f0fff0;
            font-weight: 700;
            color: #28a745;
        }
        .summary-box {
            background-color: #f9f9f9;
            border-left: 4px solid #ff9900;
            padding: 20px;
            border-radius: 4px;
            margin: 30px 0;
        }
        .summary-item {
            display: table;
            width: 100%;
            margin-bottom: 12px;
        }
        .summary-item:last-child {
            margin-bottom: 0;
        }
        .summary-label, .summary-value {
            display: table-cell;
            padding: 8px 0;
        }
        .summary-label {
            font-weight: 600;
            color: #555555;
            width: 70%;
        }
        .summary-value {
            font-weight: 700;
            color: #333333;
            text-align: right;
        }
        .footer {
            background-color: #2c3e50;
            color: #ffffff;
            padding: 30px 40px;
            text-align: center;
        }
        .footer-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .footer-text {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .contact-info {
            display: inline-block;
            text-align: left;
            margin: 0 auto;
        }
        .contact-item {
            margin-bottom: 8px;
            display: table;
        }
        .contact-item:last-child {
            margin-bottom: 0;
        }
        .contact-icon, .contact-text {
            display: table-cell;
            vertical-align: middle;
            padding: 5px 0;
        }
        .contact-icon {
            width: 30px;
            color: #ff9900;
            font-weight: bold;
        }
        .company-info {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }
        @media only screen and (max-width: 600px) {
            .content, .header, .footer {
                padding: 25px;
            }
            .header-title {
                font-size: 24px;
            }
            .section-title {
                font-size: 18px;
            }
            .info-table td {
                padding: 10px 8px;
                font-size: 14px;
            }
            .salary-table th, .salary-table td {
                padding: 10px 8px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <!-- Main container -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f7fa">
        <tr>
            <td align="center" valign="top">
                <!-- Email container -->
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
                    <!-- Header -->
                    <tr>
                        <td class="header" bgcolor="#ff9900">
                            <table width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="logo">
                                            <img
                                              src='https://goat.tekkon.com.np/images/goat.png'
                                              width='60'
                                              height='60'
                                              style='display: block; border: 0px'
                                            />
                                        </div>
                                        <h1 class="header-title">Salary Statement for ${userData.month} ${userData.year}</h1>
                                        <p class="header-subtitle">Your pay slip details are ready for review</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content">
                            <table width="100%">
                                <!-- Greeting -->
                                <tr>
                                    <td style="padding-bottom: 25px;">
                                        <p>Hello <strong>${userData.nameOfTheEmployee}</strong>,</p>
                                        <p>Please find your salary details below for the month of ${userData.month} ${userData.year}. This pay slip contains important information about your earnings and deductions.</p>
                                    </td>
                                </tr>
                                
                                <!-- Employee Information -->
                                <tr>
                                    <td>
                                        <h3 class="section-title">
                                            <span>Employee Information</span>
                                        </h3>
                                        <table class="info-table">
                                            <tr>
                                                <td class="info-label">Full Name</td>
                                                <td class="info-value">${userData.nameOfTheEmployee}</td>
                                            </tr>
                                            <tr>
                                                <td class="info-label">Position</td>
                                                <td class="info-value">${userData.position}</td>
                                            </tr>
                                            <tr>
                                                <td class="info-label">Email Address</td>
                                                <td class="info-value">${userData.email}</td>
                                            </tr>
                                            <tr>
                                                <td class="info-label">PAN Number</td>
                                                <td class="info-value">${userData.panNumber}</td>
                                            </tr>
                                            <tr>
                                                <td class="info-label">Account Number</td>
                                                <td class="info-value">${userData.accountNo}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Salary Details -->
                                <tr>
                                    <td>
                                        <h3 class="section-title">
                                            <span>Salary Details</span>
                                        </h3>
                                        <table class="salary-table">
                                            <tr>
                                                <th>Description</th>
                                                <th>Days/Hours</th>
                                                <th>Amount (Rs.)</th>
                                            </tr>
                                            <tr class="earnings-row">
                                                <td>Basic Salary</td>
                                                <td>${userData.pd}/${userData.wd}</td>
                                                <td>${userData.basicSalary}</td>
                                            </tr>
                                            <tr class="earnings-row">
                                                <td>Lumpsum Allowance</td>
                                                <td>-</td>
                                                <td>${userData.lumpsumAllowance}</td>
                                            </tr>
                                            <tr class="earnings-row">
                                                <td>Overtime Pay</td>
                                                <td>${userData.overtimeDays} days</td>
                                                <td>${userData.otAmount}</td>
                                            </tr>
                                            <tr class="earnings-row">
                                                <td>BYOD Incentive</td>
                                                <td>-</td>
                                                <td>${userData.byodIncentive}</td>
                                            </tr>
                                            <tr class="highlight-row">
                                                <td><strong>Gross Salary</strong></td>
                                                <td></td>
                                                <td><strong>${userData.grossSalary}</strong></td>
                                            </tr>
                                            <tr class="deductions-row">
                                                <td>PF Contribution</td>
                                                <td>-</td>
                                                <td>${userData.pfContribution}</td>
                                            </tr>
                                            
                                            <tr class="deductions-row">
                                                <td>CIT Deduction</td>
                                                <td>-</td>
                                                <td>${userData.citDeduction}</td>
                                            </tr>
                                             <tr class="deductions-row">
                                                <td>Negative Days</td>
                                                <td>${userData.negativeDays}</td>
                                                <td>${userData.negativeAmount}</td>
                                            </tr>
                                            <tr class="deductions-row">
                                                <td>Adjustments</td>
                                                <td>-</td>
                                                <td>${userData.adjustment}</td>
                                            </tr>
                                            <tr class="deductions-row">
                                                <td>Income Tax Deduction</td>
                                                <td>-</td>
                                                <td>${userData.taxDeduction}</td>
                                            </tr>
                                            <tr class="highlight-row">
                                                <td><strong>Total Deductions</strong></td>
                                                <td></td>
                                                <td><strong>${userData.totalDeduction}</strong></td>
                                            </tr>
                                            <tr class="net-salary-row">
                                                <td><strong>Net Salary Payable</strong></td>
                                                <td></td>
                                                <td><strong>${userData.netSalary}</strong></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Summary -->
                                <tr>
                                    <td>
                                        <div class="summary-box">
                                            <div class="summary-item">
                                                <div class="summary-label">Total Earnings:</div>
                                                <div class="summary-value">Rs. ${userData.grossSalary}.00</div>
                                            </div>
                                            <div class="summary-item">
                                                <div class="summary-label">Total Deductions:</div>
                                                <div class="summary-value">Rs. ${userData.totalDeduction}.00</div>
                                            </div>
                                            <div class="summary-item">
                                                <div class="summary-label">Net Pay:</div>
                                                <div class="summary-value">Rs. ${userData.netSalary}.00</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Closing -->
                                <tr>
                                    <td style="padding-top: 20px;">
                                        <p>Your salary has been deposited to your registered bank account. Please review the details and contact our accounts department if you have any questions or discrepancies.</p>
                                        <p style="margin-top: 20px;"><strong>Regards,</strong><br>Accounts Department<br>Tekkon Technologies</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer" bgcolor="#2c3e50">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <h3 class="footer-title">Need Assistance?</h3>
                                        <p class="footer-text">If you have questions about your pay slip, contact our accounts team:</p>
                                        
                                        <div class="contact-info">
                                            <div class="contact-item">
                                                <div class="contact-icon">📧</div>
                                                <div class="contact-text" style="color:white;">accounts@tekkon.com</div>
                                            </div>
                                            <div class="contact-item">
                                                <div class="contact-icon">📱</div>
                                                <div class="contact-text">+977 9803466217</div>
                                            </div>
                                            <div class="contact-item">
                                                <div class="contact-icon">🕒</div>
                                                <div class="contact-text">Mon-Fri, 9:00 AM - 5:30 PM</div>
                                            </div>
                                        </div>
                                        
                                        <div class="company-info">
                                            <p>Tekkon Technologies</p>
                                            <p>Kathmandu, Nepal</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
 `
}

export default emailTemplate
