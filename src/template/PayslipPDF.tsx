import React from "react"
import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { SalaryRow } from "@/types/types"

// Register Lato font (compatible with @react-pdf/renderer)
Font.register({
  family: "Lato",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff",
      fontWeight: "bold",
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: "Lato",
    fontSize: 11,
    lineHeight: 1.4,
    padding: 32,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },

  // Header Section
  headerContainer: {
    marginBottom: 32,
    borderBottom: "3px solid #ff9900",
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff9900",
    marginBottom: 6,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  companyDetails: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.3,
    marginTop: 2,
    marginLeft: 2,
  },

  // Employee Info Section
  infoSection: {
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 6,
    border: "1px solid #e9ecef",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 32,
  },
  infoColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff9900",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: 85,
    fontSize: 9,
    color: "#666666",
    fontWeight: "medium",
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: "#1a1a1a",
  },
  normalText: {
    color: "#666666",
    textDecoration: "none",
  },

  // Attendance Section
  attendanceSection: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
  },
  attendanceCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #e9ecef",
    borderRadius: 6,
    padding: 16,
    textAlign: "center",
  },
  attendanceLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  attendanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff9900",
  },

  // Salary Table
  salarySection: {
    marginBottom: 24,
  },
  salaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  table: {
    border: "1px solid #e9ecef",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    fontSize: 11,
    fontWeight: "bold",
    color: "#495057",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f3f4",
  },
  tableRowEven: {
    backgroundColor: "#fafbfc",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    fontSize: 10,
    color: "#1a1a1a",
  },
  tableCellAmount: {
    textAlign: "right",
    fontWeight: "medium",
  },

  // Earnings and Deductions
  summarySection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #e9ecef",
    borderRadius: 6,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ff9900",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "medium",
    color: "#1a1a1a",
  },

  // Net Salary
  netSalarySection: {
    backgroundColor: "#ff9900",
    color: "#ffffff",
    padding: 16,
    borderRadius: 6,
    marginBottom: 20,
  },
  netSalaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netSalaryLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  netSalaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingTop: 10,
    borderTop: "1px solid #e9ecef",
    textAlign: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.4,
  },
  footerBold: {
    fontWeight: "bold",
    color: "#ff9900",
  },
})

const PayslipInvoicePDF = ({
  userData,
  companyName = "Tekkon Technologies Pvt. Ltd.",
  companyAddress = "Kathmandu, Nepal",
  companyRegdNo = "184097/074/075",
  companyPhoneNumber = "+977 9803466217 ",
  companyPan = "606777234",
  companyEmail = " info@tekkon.com.np",
  companyAccountEmail = " accounts@tekkon.com.np",
}: {
  userData: SalaryRow
  companyName?: string
  companyAddress?: string
  companyPan?: string
  companyEmail?: string
  companyRegdNo?: string
  companyPhoneNumber?: string
  companyAccountEmail?: string
}) => {
  // Earnings data
  const earnings = [
    { label: "Basic Salary", amount: userData.basicSalary },
    { label: "Lumpsum Allowance", amount: userData.lumpsumAllowance },
    { label: "Overtime Amount", amount: userData.otAmount },
    { label: "BYOD Incentive", amount: userData.byodIncentive },
  ]

  // Deductions data
  const deductions = [
    { label: "PF Deduction", amount: userData.pfDeduction },
    { label: "CIT Deduction", amount: userData.citDeduction },
    { label: "Tax Deduction", amount: userData.taxDeduction },
    { label: "Negative Amount", amount: userData.negativeAmount },
    { label: "Adjustment", amount: userData.adjustment },
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.companySection}>
              <Link src="https://tekkon.com.np">
                <Text style={styles.companyName}>{companyName}</Text>
              </Link>
              <View style={styles.companyDetails}>
                <Text>Address: {companyAddress}</Text>
                <Text>Regd No: {companyRegdNo}</Text>
                <Text>PAN: {companyPan}</Text>
                <Text>Phone: {companyPhoneNumber}</Text>
                <Link src={`mailto:${companyEmail}`} style={styles.normalText}>
                  <Text>Email: {companyEmail}</Text>
                </Link>
              </View>
            </View>
          </View>
        </View>

        {/* Employee Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Employee Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>
                  {userData.nameOfTheEmployee}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoValue}>{userData.position}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PAN:</Text>
                <Text style={styles.infoValue}>{userData.panNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account:</Text>
                <Text style={styles.infoValue}>{userData.accountNo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Month:</Text>
                <Text style={styles.infoValue}>
                  {userData.month} {userData.year}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Cards */}
        <View style={styles.attendanceSection}>
          <View style={styles.attendanceCard}>
            <Text style={styles.attendanceLabel}>Working Days</Text>
            <Text style={styles.attendanceValue}>{userData.wd}</Text>
          </View>
          <View style={styles.attendanceCard}>
            <Text style={styles.attendanceLabel}>Payable Days</Text>
            <Text style={styles.attendanceValue}>{userData.pd}</Text>
          </View>
          <View style={styles.attendanceCard}>
            <Text style={styles.attendanceLabel}>Overtime Days</Text>
            <Text style={styles.attendanceValue}>
              {userData.overtimeDays || 0}
            </Text>
          </View>
          <View style={styles.attendanceCard}>
            <Text style={styles.attendanceLabel}>Negative Days</Text>
            <Text style={styles.attendanceValue}>
              {userData.negativeDays || 0}
            </Text>
          </View>
        </View>

        {/* Earnings and Deductions Summary */}
        <View style={styles.summarySection}>
          {/* Earnings */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Earnings</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Salary</Text>
              <Text style={styles.summaryValue}>
                Rs. {userData.grossSalary}
              </Text>
            </View>
            {earnings.map((item, index) => (
              <View style={styles.summaryRow} key={index}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>Rs. {item.amount}</Text>
              </View>
            ))}
            <View
              style={[
                styles.summaryRow,
                { borderTop: "1px solid #e9ecef", paddingTop: 8, marginTop: 8 },
              ]}
            >
              <Text
                style={[
                  styles.summaryLabel,
                  { fontWeight: "bold", color: "#1a1a1a" },
                ]}
              >
                Salary Before TDS
              </Text>
              <Text style={[styles.summaryValue, { fontWeight: "bold" }]}>
                Rs. {userData.salaryBeforeTDS}
              </Text>
            </View>
          </View>

          {/* Deductions */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Deductions</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PF Contribution</Text>
              <Text style={styles.summaryValue}>
                Rs. {userData.pfContribution}
              </Text>
            </View>
            {deductions.map((item, index) => (
              <View style={styles.summaryRow} key={index}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>Rs. {item.amount}</Text>
              </View>
            ))}
            <View
              style={[
                styles.summaryRow,
                { borderTop: "1px solid #e9ecef", paddingTop: 8, marginTop: 8 },
              ]}
            >
              <Text
                style={[
                  styles.summaryLabel,
                  { fontWeight: "bold", color: "#1a1a1a" },
                ]}
              >
                Total Deductions
              </Text>
              <Text style={[styles.summaryValue, { fontWeight: "bold" }]}>
                Rs. {userData.totalDeduction}
              </Text>
            </View>
          </View>
        </View>

        {/* Net Salary */}
        <View style={styles.netSalarySection}>
          <View style={styles.netSalaryRow}>
            <Text style={styles.netSalaryLabel}>Net Salary</Text>
            <Text style={styles.netSalaryValue}>Rs. {userData.netSalary}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a{" "}
            <Text style={styles.footerBold}>computer-generated payslip</Text>{" "}
            and does not require a signature.
          </Text>
          <Text style={styles.footerText}>
            For any queries regarding this payslip, please contact the{" "}
            <Text style={styles.footerBold}>Accounts Department</Text> at{" "}
            <Link
              style={styles.footerBold}
              src={`mailto:${companyAccountEmail}`}
            >
              <Text>{companyAccountEmail}</Text>
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default PayslipInvoicePDF
