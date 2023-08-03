# Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from erpnext.hr.utils import validate_active_employee
from frappe.core.doctype.user.user import share_doc_with_approver


class TravelRequest(Document):
	def autoname(self):
		self.name =  make_autoname(self.employee + "/" +(str(self.from_date)) + "/" + ".##")
		self.requition_no = make_autoname(self.employee_name + "-.##")
        
	def validate(self):
		validate_active_employee(self.employee)
	
	def on_submit(self):
		if self.status != "Approved":
			frappe.throw(("Document status must be 'Approved' before submitting."))

	def on_update(self):
		if self.status == "Approved":
			self.flags.ignore_permissions = True
			self.submit()
			self.reload()

@frappe.whitelist()
def get_employee_doc(employee):
	employee = frappe.get_doc("Employee",employee)
	if not employee.expense_approver and not employee.travel_expense_checking_officer:
		return 1
	elif not employee.travel_expense_checking_officer:
		return 2
	elif not employee.expense_approver:
		return 3
	else:
		return 0


@frappe.whitelist()
def report_to_person_view_travel_request_form(name,approving_officer,checking_officer):
	get_travel_request_form = frappe.get_doc("Travel Request",name)
	share_doc_with_approver(get_travel_request_form, approving_officer)
	share_doc_with_approver(get_travel_request_form, checking_officer)


@frappe.whitelist()
def get_doc(travelling_start_date, grade):
    sql_query = """
        SELECT *
        FROM `tabTravel Allowance Policy`
        WHERE effective_from_date <= %s
        AND (policy_end_date > %s OR policy_end_date = '' OR policy_end_date IS NULL)
        AND grade = %s
    """
    policies = frappe.db.sql(sql_query, (travelling_start_date, travelling_start_date, grade), as_dict=True)
    
    if policies:
        return frappe.get_doc("Travel Allowance Policy", policies[0].name)
    else:
        return 0

	
@frappe.whitelist()
def get_grade_child_details(grade,mode,travelling_start_date):
	doc = get_doc(travelling_start_date, grade)
	mode_data = []
	if mode == "Bus":
		for travel_mode in doc.get("bus"):
			mode_data.append(travel_mode.bus_table)
	elif mode == "Air Travel":
		for travel_mode in doc.get("air_travel"):
			mode_data.append(travel_mode.air_travel_table)
	elif mode == "Railway":
		for travel_mode in doc.get("railway"):
			mode_data.append(travel_mode.railway_table)
	elif mode == "Local":
		for travel_mode in doc.get("local"):
			mode_data.append(travel_mode.local_table)

	return mode_data

