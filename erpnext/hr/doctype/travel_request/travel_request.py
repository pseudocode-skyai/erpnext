# Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
import datetime
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
def report_to_person_view_travel_request_form(name,approving_officer):
	get_travel_request_form = frappe.get_doc("Travel Request",name)
	share_doc_with_approver(get_travel_request_form, approving_officer)
	combined_users = frappe.get_all("User", filters={
            "designation": ["in", ["Accountant", "HR"]]
        })
	if combined_users:
			for user in combined_users:
				share_doc_with_approver(get_travel_request_form, user.name)


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

@frappe.whitelist()
def generate_accountant_notification(name,name_of_employee,status,approving_officer,prepared_by):
	arr = []
	combined_users = frappe.get_all("User", filters={
            "designation": ["in", ["Accountant", "HR"]]
        })	
	for user in combined_users:
		user_name = user.name
		notification_send_to_user(name,name_of_employee,status,user_name)

	if approving_officer != "":
		user_name = approving_officer
		notification_send_to_user(name,name_of_employee,status,user_name)

	if status == "Approved" or status == "Reject" or  status == "Return":
		user_name = prepared_by
		notification_send_to_user(name,name_of_employee,status,user_name)

@frappe.whitelist()
def notification_send_to_user(name,name_of_employee,status,user_name):
	create_event = frappe.new_doc("Event")
	create_event.subject = f"{name} - {name_of_employee}"
	create_event.description = "Travel Request"
	create_event.starts_on = datetime.date.today()
	create_event.sender =user_name
	if status == "To Be Check":
		create_event.status = "Travel Form To Be Check"
	elif status == "To Be Approved":
		create_event.status = "Travel Form To Be Approved"
	elif status == "Approved":
		create_event.status = "Travel Form Approved"
	elif status == "Reject":
		create_event.status = "Travel Form Reject"
	elif status == "Return":
		create_event.status = "Travel Form Return"
	elif status == "Cancel the Request":
		create_event.status = "Travel Form Cancel the Request"
	create_event.insert(ignore_mandatory=True, ignore_permissions = True)


@frappe.whitelist()
def travel_request_form(name):
	arr = []
	accountant_users = frappe.get_all("User", filters={"designation": "Accountant"})
	if accountant_users:
			for user in accountant_users:
				arr.append(user)
			return arr
	
@frappe.whitelist()
def get_employee_data(currentUserEmail):
	if frappe.db.exists({"doctype": "Employee", "company_email": currentUserEmail}):
		employee_data = frappe.get_doc("Employee", {"company_email": currentUserEmail})
	else:
		frappe.throw(("Employee Data Not Found" + "-" + str(currentUserEmail)))
		employee_data = "None"
	return employee_data