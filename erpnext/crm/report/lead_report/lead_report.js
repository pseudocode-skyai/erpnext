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
			"fieldname":"status",
			"label": __("Status"),
			"fieldtype": "Select",
			options: [
				{ "value": "Open", "label": __("Open") },
				{ "value": "Contacted", "label": __("Contacted") },
				{ "value": "Success", "label": __("Success") },
				{ "value": "Close", "label": __("Close") },
			],
		}
	]
};
