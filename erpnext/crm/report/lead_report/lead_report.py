# # Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
# # For license information, please see license.txt

import frappe
def execute(filters=None):
	columns = [
		{"label": ("Date"), "fieldname": "date", "fieldtype": "Data", "width": 120},
       	{
			"label": ("Lead"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "Lead",
			"width": 150,
		},
		{"label": ("Users"), "fieldname": "users", "fieldtype": "Data", "width": 120},
		{"fieldname": "status", "label": ("Status"), "fieldtype": "Data", "width": 100},
		{"fieldname": "sub_status", "label": ("Sub Status"), "fieldtype": "Data", "width": 100},
		{"label": ("Customer Name"), "fieldname": "customer_name", "fieldtype": "Data", "width": 120},
		{"label": ("Source"), "fieldname": "source", "fieldtype": "Data", "width": 120},
		{"label": ("Person Name"), "fieldname": "person_name", "fieldtype": "Data", "width": 120},
		{"label": ("Designation"), "fieldname": "designation", "fieldtype": "Data", "width": 120},
		{"label": ("Department"), "fieldname": "department", "fieldtype": "Data", "width": 120},
		{"label": ("Primary Email Id"), "fieldname": "primary_email_id", "fieldtype": "Data", "width": 120},
		{"label": ("Primary Mobile Number"), "fieldname": "primary_mobile_number", "fieldtype": "Data", "width": 120},
		{"label": ("Lead Transfer"), "fieldname": "lead_transfer", "fieldtype": "Data", "width": 120},
    ]
	data = frappe.db.sql("""
	    SELECT 
			pt.date,
	        pt.name,
			pt.users,
			pt.status,
			pt.sub_status,
			pt.customer_name,
			pt.source,
			ct.person_name,
			ct.designation,
			ct.department,
			ct.primary_email_id,
			ct.primary_mobile_number,
			pt.lead_transfer
	    FROM
            `tabLead` pt,
            `tabLead Contact Person Details` ct
        WHERE
            pt.name = ct.parent AND pt.creation BETWEEN %(from_date)s AND %(to_date)s
            {conditions}
        ORDER BY
            pt.creation asc """.format(
            conditions=get_conditions(filters)
        ),
		filters,
		as_dict=1,
	)
	return columns, data

def get_conditions(filters):
    conditions = []
    if filters.get("status"):
        conditions.append(" and status=%(status)s")
    if filters.get("customer_name"):
        conditions.append(" and customer_name=%(customer_name)s")
    if filters.get("sub_status"):
        conditions.append(" and sub_status=%(sub_status)s")
    if filters.get("designation"):
        conditions.append(" and designation=%(designation)s")
    if filters.get("department"):
        conditions.append(" and department=%(department)s")
    return " ".join(conditions) if conditions else ""