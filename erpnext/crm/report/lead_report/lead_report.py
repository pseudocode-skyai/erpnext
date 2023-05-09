# # Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
# # For license information, please see license.txt

import frappe
def execute(filters=None):
	columns = [
       	{
			"label": ("Lead"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "Lead",
			"width": 150,
		},
		{"label": ("Users"), "fieldname": "users", "fieldtype": "Data", "width": 120},
		{"fieldname": "status", "label": ("Status"), "fieldtype": "Data", "width": 100},
		{"label": ("Person Name"), "fieldname": "person_name", "fieldtype": "Data", "width": 120},
		{"label": ("Department"), "fieldname": "department", "fieldtype": "Data", "width": 120},
		{"label": ("Customer Name"), "fieldname": "customer_name", "fieldtype": "Data", "width": 120},
		{"label": ("Designation"), "fieldname": "designation", "fieldtype": "Data", "width": 120},
		{"label": ("Lead Transfer"), "fieldname": "lead_transfer", "fieldtype": "Data", "width": 120},
		{"label": ("Primary Email Id"), "fieldname": "primary_email_id", "fieldtype": "Data", "width": 120},
		{"label": ("Primary Mobile Number"), "fieldname": "primary_mobile_number", "fieldtype": "Data", "width": 120},
    ]
	data = frappe.db.sql("""
	    SELECT 
	        pt.name,
			pt.users,
			pt.status,
			ct.person_name,
			ct.department,
			pt.customer_name,
			ct.designation,
			pt.lead_transfer,
			ct.primary_email_id,
			ct.primary_mobile_number
	    FROM 
	        `tabLead` pt, 
	        `tabLead Contact Person Details` ct 
	    WHERE 
	        pt.name = ct.parent
	    ORDER BY
			pt.creation asc """,
		filters,
		as_dict=1,
	)
	return columns, data