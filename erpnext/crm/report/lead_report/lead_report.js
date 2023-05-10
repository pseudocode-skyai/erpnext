// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */



frappe.query_reports["Lead Report"] = {
	"filters": [
		{
			"fieldname":"customer_name",
			"label": __("Customer Name"),
			"fieldtype": "Link",
			"options": "Customer",
		},
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -12),
			"reqd": 1
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1
		},
		{
			"fieldname":"designation",
			"label": __("Designation"),
			"fieldtype": "Link",
			"options": "Designation",
		},
		{
			"fieldname":"department",
			"label": __("Department"),
			"fieldtype": "Link",
			"options": "Person Department",
		},
		{
			"fieldname":"status",
			"label": __("Status"),
			"fieldtype": "Select",
			options: [
				"",
				{ "value": "Open", "label": __("Open") },
				{ "value": "Contacted", "label": __("Contacted") },
				{ "value": "Success", "label": __("Success") },
				{ "value": "Close", "label": __("Close") },
			],
		},
		{
			"fieldname":"sub_status",
			"label": __("Sub Status"),
			"fieldtype": "Select",
			options: [
				"",
				{ "value": "On Call Discussion", "label": __("On Call Discussion") },
				{ "value": "Technical Visit", "label": __("Technical Visit") },
				{ "value": "Quotation", "label": __("Quotation") },
				{ "value": "Follow Up", "label": __("Follow Up") },
				{ "value": "Budgetary  Discussion", "label": __("Budgetary  Discussion") },
				{ "value": "Negotiation", "label": __("Negotiation") },
			],
		},
	]
};
