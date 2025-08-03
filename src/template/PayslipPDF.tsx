import React from "react"
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { SalaryRow } from "@/types/types"

// Optional: Register Lato font for a modern look
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
    fontSize: 12,
    padding: 40,
    backgroundColor: "#fff",
    color: "#222",
  },
  header: {
    borderBottom: "2px solid #ff9900",
    marginBottom: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  company: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9900",
  },
  payslipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f6f6f6",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: "bold",
    padding: 6,
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 12,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: "#ff9900",
    marginTop: 8,
    fontWeight: "bold",
  },
  totalLabel: {
    flex: 2,
    textAlign: "right",
    padding: 6,
    fontSize: 12,
  },
  totalValue: {
    flex: 1,
    textAlign: "right",
    padding: 6,
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    color: "#888",
    textAlign: "center",
  },
})

const PayslipInvoicePDF = ({
  userData,
  companyName = "Tekkon Technologies Pvt. Ltd.",
  companyAddress = "Kathmandu, Nepal",
  companyPan = "123456789",
  companyEmail = "accounts@tekkon.com.np",
}: {
  userData: SalaryRow
  companyName?: string
  companyAddress?: string
  companyPan?: string
  companyEmail?: string
}) => {
  // Table rows for salary breakdown
  const tableRows = [
    ["Gross Salary", userData.grossSalary],
    ["Basic Salary", userData.basicSalary],
    ["Lumpsum Allowance", userData.lumpsumAllowance],
    ["Salary Before TDS", userData.salaryBeforeTDS],
    ["PF Contribution", userData.pfContribution],
    ["Overtime Days", userData.overtimeDays],
    ["Overtime Amount", userData.otAmount],
    ["BYOD Incentive", userData.byodIncentive],
    ["Negative Days", userData.negativeDays],
    ["Amount", userData.negativeAmount],
    ["CIT Deduction", userData.citDeduction],
    ["PF Deduction", userData.pfDeduction],
    ["Tax Deduction", userData.taxDeduction],
    ["Adjustment", userData.adjustment],
    ["Total Deduction", userData.totalDeduction],
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.company}>{companyName}</Text>
          <Text>Payslip for the month of {userData.month}</Text>
        </View>

        {/* Company & Employee Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold" }}>Company:</Text>
              <Text>{companyName}</Text>
              <Text>{companyAddress}</Text>
              <Text>PAN: {companyPan}</Text>
              <Text>{companyEmail}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold" }}>Employee:</Text>
              <Text>{userData.nameOfTheEmployee}</Text>
              <Text>{userData.position}</Text>
              <Text>{userData.email}</Text>
              <Text>PAN: {userData.panNumber}</Text>
              <Text>Account No: {userData.accountNo}</Text>
            </View>
          </View>
        </View>

        {/* Payslip Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Month:</Text>
            <Text style={styles.value}>{userData.month || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Working Days:</Text>
            <Text style={styles.value}>{userData.wd}</Text>
            <Text style={styles.label}>Payable Days:</Text>
            <Text style={styles.value}>{userData.pd}</Text>
          </View>
        </View>

        {/* Salary Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellHeader}>Description</Text>
            <Text style={styles.tableCellHeader}>Amount</Text>
          </View>
          {tableRows.map(([desc, amt], idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{desc}</Text>
              <Text style={styles.tableCell}>Rs. {amt}</Text>
            </View>
          ))}
        </View>

        {/* Net Salary */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Net Salary</Text>
          <Text style={styles.totalValue}>Rs. {userData.netSalary}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated payslip. For queries, contact Accounts
          Department.
        </Text>
      </Page>
    </Document>
  )
}

export default PayslipInvoicePDF
