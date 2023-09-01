// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt


frappe.ui.form.on("Travel Request", {
	to_date: function(frm) {
		if (frm.doc.to_date <frm.doc.from_date) {
			frm.doc.to_date = '';
            frm.refresh_field('to_date');
			frappe.throw('To Date must be greater than or equal to From Date');
           
        }
		if (cur_frm.doc.from_date){
			frappe.call({                        
				method: "erpnext.hr.doctype.travel_request.travel_request.get_doc", 
				args: { 
					travelling_start_date:frm.doc.from_date,
					grade:frm.doc.employee_grade
					},
				callback: function(r) {
					if (r.message == 0){ 
						frm.set_value('from_date', null);
						frappe.throw(__("No Travel Allowance Policy found."));
						frappe.validated = false;
					}
				}
			})
		}
	},
	grade_details: function(frm) {
		$.each(frm.doc.travel_requisition || [], function (i, row) {
			frappe.call({
				method: "erpnext.hr.doctype.travel_request.travel_request.get_grade_child_details",
				async:false,
				args: {grade:frm.doc.employee_grade,
					mode: row.mode,
					travelling_start_date:frm.doc.from_date,
					travelling_end_date:frm.doc.to_date
				},
				callback: function(r) {
					var options = r.message
					var field = frappe.meta.get_docfield("Travel Requisition","class", row.name);
					field.options = [""].concat(options);
					cur_frm.refresh_field("class");
				}
			})
		})
	},
	before_save :function(frm){
		if (frm.doc.__islocal)
		{	frm.set_value("status", "Draft");
		}
	},
	refresh: function (frm) {
		if (frm.doc.__islocal) {
			var currentUserEmail = frappe.session.user;
			if (currentUserEmail) {
				frappe.call({
					"method": "erpnext.hr.doctype.travel_request.travel_request.get_employee_data",
					args: {
						currentUserEmail: currentUserEmail
					},
					callback: function(response){
						var currentempployeeform = response.message
						cur_frm.set_value("employee",currentempployeeform.name);
						cur_frm.set_value("employee_name",currentempployeeform.employee_name);
	
						if (!currentempployeeform.grade && !currentempployeeform.expense_approver){
							cur_frm.disable_save();
							frappe.throw(__("Please set Travel Expense Approving Officer and Employee Grade:  " + currentempployeeform.name));
						}
						else if (!currentempployeeform.grade && currentempployeeform.expense_approver){
							cur_frm.set_value("approved_by",currentempployeeform.expense_approver);
							cur_frm.disable_save();
							frappe.throw(__("Please set Employee Grade: " + currentempployeeform.employee_number));
						}else if (!currentempployeeform.expense_approver && currentempployeeform.grade ){
							cur_frm.set_value("employee_grade",currentempployeeform.grade);
							cur_frm.disable_save();
							frappe.throw(__("Please set Travel Expense Approving Officer: " + currentempployeeform.name));
						}
						else{
							cur_frm.set_value("employee_grade",currentempployeeform.grade);
							cur_frm.set_value("approved_by",currentempployeeform.expense_approver);
						}
					}
				})
			}
		}
		
		cur_frm.page.clear_primary_action();
		cur_frm.page.clear_secondary_action();
		let divElement = document.querySelector('.form-message.blue');

		// Check if the element was found
		if (divElement) {
			// Hide the element by setting its display property to 'none'
			divElement.style.display = 'none';
		}

		if (frm.doc.status == "Reject") {
			$('.primary-action').prop('disabled', true);
			$('.primary-action').prop('hidden', true);		
		}	
		if (frm.doc.employee_grade){
			frm.events.grade_details(frm);
		}
		let doc = frm.doc;
			// Disable save button for users other than prepared_by
		if (frappe.session.user !== frm.doc.prepared_by) {
			cur_frm.disable_save();
		}
		if (!frm.doc.__islocal) {
			$('.primary-action').prop('disabled', true);
			if (cur_frm.doc.status != "Draft" && cur_frm.doc.status != "Return") {
			
				frm.fields.forEach(function(field) {
					frm.set_df_property(field.df.fieldname, 'read_only', 1);
				});
			}else{
				if (frappe.session.user !== frm.doc.prepared_by){
					frm.fields.forEach(function(field) {
						frm.set_df_property(field.df.fieldname, 'read_only', 1);
					});
				}

			}
			if (frappe.session.user === cur_frm.doc.prepared_by){
				if (cur_frm.doc.status === "Draft" || cur_frm.doc.status === "Return") {
					cur_frm.add_custom_button(__('Send to Approval'), () => cur_frm.events.approved_request(), __("Status"));
				}
				if (frm.doc.status == "To Be Check") {
					cur_frm.disable_save();				
				}		
				if (cur_frm.doc.status != "Cancelled Request" && doc.docstatus != 2  && cur_frm.doc.status != "Draft"  && cur_frm.doc.status != "Reject")
				{
					if (cur_frm.doc.status === "Approved"){
						cur_frm.page.set_secondary_action(__('Cancel the Request'), () => cur_frm.events.cancel());
					}else {
						cur_frm.add_custom_button(__('Cancel the Request'), () => cur_frm.events.cancel());
					}
				}
				if(cur_frm.doc.admin_remark) {
					cur_frm.set_df_property("admin_remark", 'read_only', 1);
					cur_frm.set_df_property("ticket_attachment", 'read_only', 0);
					frm.fields_dict.ticket_attachment.$wrapper.find('[data-action="clear_attachment"]').hide();
				}
		
			}

		}
		if (frappe.session.user === cur_frm.doc.approved_by) {
			if (frm.doc.status == "To Be Check" ){
				cur_frm.add_custom_button(__('Check'), () => cur_frm.events.checking(), __("Status"));
			}
			if (frm.doc.status == "To Be Approved" || frm.doc.status == "To Be Check"){
				cur_frm.add_custom_button(__('Return'), () => cur_frm.events.return(), __("Status"));
			}
			if (frm.doc.status=== "To Be Approved") {
				if (frm.doc.status != "Approved") {
					cur_frm.add_custom_button(__('Approved'), () => cur_frm.events.approved(), __("Status"));
				}		
			}
			if (frm.doc.status=== "To Be Approved") {
				{
					cur_frm.add_custom_button(__('Reject'), () => cur_frm.events.reject(), __("Status"));
				}		
			}	
			if(cur_frm.doc.admin_remark) {
				cur_frm.set_df_property("admin_remark", 'read_only', 1);
				cur_frm.set_df_property("ticket_attachment", 'read_only', 0);
				frm.fields_dict.ticket_attachment.$wrapper.find('[data-action="clear_attachment"]').hide();
			}

		}
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.travel_request_form", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
				},
				callback :function(r){
					var accountantUsers = r.message;
					var currentUserEmail = frappe.session.user;
				

					if (accountantUsers) {
						for (var i = 0; i < accountantUsers.length; i++) {
							if (currentUserEmail === accountantUsers[i].name) {
								if (doc.status == "To Be Check" ){
									cur_frm.add_custom_button(__('Check'), () => cur_frm.events.checking(), __("Status"));
								}
								if (cur_frm.doc.status != "Advance Amount Processed" && (cur_frm.doc.status === "Approved" ||  cur_frm.doc.status === "Ticket Booked" || cur_frm.doc.status === "Ticket Cancelled"))
									cur_frm.add_custom_button(__('Advance Processed'), () => cur_frm.events.advance_amount_processed());

								if(cur_frm.doc.admin_remark) {
									cur_frm.set_df_property("admin_remark", 'read_only', 1);
									cur_frm.set_df_property("ticket_attachment", 'read_only', 0);
									frm.fields_dict.ticket_attachment.$wrapper.find('[data-action="clear_attachment"]').hide();
								}
							}
						}
					}
				}	 
		 });
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.travel_request_form_officer", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
				},
				callback :function(r){
					var administrative_officer = r.message;
					var currentUserEmail = frappe.session.user;
					
					if (administrative_officer) {
						for (var i = 0; i < administrative_officer.length; i++) {
							if (currentUserEmail === administrative_officer[i].name) {
								if (cur_frm.doc.status != "Ticket Booked" && (cur_frm.doc.status === "Approved" || cur_frm.doc.status === "Advance Amount Processed"))
								cur_frm.add_custom_button(__('Ticket book'), () => cur_frm.events.ticket_booked());
								if (cur_frm.doc.status === "Ticket Booked" && cur_frm.doc.status != "Ticket Cancelled")
								cur_frm.add_custom_button(__('Ticket Cancel'), () => cur_frm.events.ticket_cancel());
								if(cur_frm.doc.admin_remark) {
									cur_frm.set_df_property("admin_remark", 'read_only', 0);
									cur_frm.set_df_property("ticket_attachment", 'read_only', 0);
								}
							}
							
						}
					}
				}	 
		 });
		if (cur_frm.doc.status=="To Be Check" && cur_frm.doc.check_remark ){
			cur_frm.events.check_remark(frm);
		}


	},

	admin_remark: function(frm){
		if (cur_frm.doc.admin_remark != ""){
			frappe.call({
				method:"erpnext.hr.doctype.travel_request.travel_request.admin_remark",
				args: {docname: cur_frm.doc.name,
					admin_remark:cur_frm.doc.admin_remark
				}
			})
			setTimeout(function(){
				window.location.reload(1);
			}, 500);
		}
	},
	advance_amount_processed: function(frm) {	
		let d = new frappe.ui.Dialog({
			title: 'Accountant Remark',
			fields: [
				{
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				d.hide();
				frappe.call({
					method:"erpnext.hr.doctype.travel_request.travel_request.update_remarks_and_status",
					args: {docname: cur_frm.doc.name,
						remark:value["remark"],
						name_of_employee : cur_frm.doc.employee_name,
						approving_officer :cur_frm.doc.approved_by,
						prepared_by :cur_frm.doc.prepared_by
					}
                })
				cur_frm.reload_doc();

			}
		});
		d.show();

	},
	
	ticket_attachment:function(frm){
		if (cur_frm.doc.ticket_attachment === ""){
			frappe.call({
				async:false,
				method:"erpnext.hr.doctype.travel_request.travel_request.ticket_attachment_update",
				args: {docname: cur_frm.doc.name,
					ticket_attachment:""
				}
			})
			window.location.reload(1);
		}
		else{
			frappe.call({
				async:false,
				method:"erpnext.hr.doctype.travel_request.travel_request.ticket_attachment_update",
				args: {docname: cur_frm.doc.name,
					ticket_attachment:cur_frm.doc.ticket_attachment

				}
				
			})
			window.location.reload(1);

		}
	},
	ticket_cancel: function(frm){
		let d = new frappe.ui.Dialog({
			title: 'Admin Officer Remark',
			fields: [
				{
					label:"Remark",
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				d.hide();
				frappe.call({
					method:"erpnext.hr.doctype.travel_request.travel_request.ticket_cancelled",
					args: {docname: cur_frm.doc.name,
						remark:value["remark"]
					}
				})
				cur_frm.cscript.update_status("Ticket Cancelled");
				cur_frm.save();
		

			}
		});
		d.show();

	},

	ticket_booked: function(frm){
		let d = new frappe.ui.Dialog({
			title: 'Admin Officer Remark',
			fields: [
				{
					label:"Remark",
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
				{
					label:"Ticket Attachment",
					fieldname: 'ticket_attachment',
					fieldtype: 'Attach',
					"reqd": 1,

				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				d.hide();
				var currentUserEmail = frappe.session.user;
				cur_frm.set_value("administrative_officer",currentUserEmail);
				cur_frm.set_value("administrative_officer_name", frappe.user.full_name());
				frappe.call({
					async:false,

					method:"erpnext.hr.doctype.travel_request.travel_request.ticket_booked",
					args: {docname: cur_frm.doc.name,
						remark:value["remark"],
						ticket_attachment:value["ticket_attachment"],
						administrative_officer:currentUserEmail,
						administrative_officer_name:frappe.user.full_name()
					}
				})
				

				cur_frm.cscript.update_status("Ticket Booked");
				cur_frm.save()
			}
		});
		d.show();

	},
	checking: function(frm){
		let travel_request_accountant_remark_table  = cur_frm.add_child("travel_request_accountant_remark_table");

		let d = new frappe.ui.Dialog({
			title: 'Checker Remark',
			fields: [
				{
					fieldname: 'remark',
					fieldtype: 'Small Text'
				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				cur_frm.set_value("status","To Be Approved");
				var today = frappe.datetime.now_date();
				travel_request_accountant_remark_table.remark = (value["remark"]);
				travel_request_accountant_remark_table.date = (today);
				travel_request_accountant_remark_table.status = ("To Be Approved");
				d.hide();
				var currentUserEmail = frappe.session.user;
				cur_frm.set_value("checked_by",currentUserEmail);
				cur_frm.save();
				cur_frm.events.send_notification_to_user(frm);	
			}
		});
		d.show();
	},
	cancel: function(frm){
		if (cur_frm.doc.status=== "Approved")
		{
			cur_frm._cancel();
			cur_frm.events.send_notification_to_user(frm);
		}
		else{
			frappe.confirm(
			__('Permanently Cancel ' + cur_frm.docname + '?'),
			function(){
				cur_frm.set_value("status", "Cancelled Request");
				cur_frm.save();
				cur_frm.events.send_notification_to_user(frm);
				cur_frm.fields.forEach(function(field) {
					cur_frm.set_df_property(field.df.fieldname, 'read_only', 1);
				});
			},
			function(){
				window.close();
			}
		);
		}

	},
	reject: function(frm){
		let travel_request_hod_remark_table  = cur_frm.add_child("travel_request_hod_remark_table");

		let d = new frappe.ui.Dialog({
			
			title: 'Reject Remark',
			fields: [
				{
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				d.hide();
				var today = frappe.datetime.now_date();
				travel_request_hod_remark_table.remark = (value["remark"]);
				travel_request_hod_remark_table.date = (today);
				travel_request_hod_remark_table.status = ("Reject");
				refresh_field("travel_request_hod_remark_table");
			
				cur_frm.set_value("status","Reject");
				cur_frm.save();
				cur_frm.events.send_notification_to_user(frm);
				cur_frm.fields.forEach(function(field) {
					frm.set_df_property(field.df.fieldname, 'read_only', 1);
				});
				setTimeout(function(){
					window.location.reload(1);
				}, 500);
			}
		});
		d.show();
	},
	return: function(frm){
		let travel_request_hod_remark_table  = cur_frm.add_child("travel_request_hod_remark_table");

		let d = new frappe.ui.Dialog({
			
			title: 'Remark',
			fields: [
				{
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
			],
			primary_action_label: 'Submit',
			primary_action(value) {
				d.hide();
				var today = frappe.datetime.now_date();
				travel_request_hod_remark_table.remark = (value["remark"]);
				travel_request_hod_remark_table.date = (today);
				travel_request_hod_remark_table.status = ("Return");
				refresh_field("travel_request_hod_remark_table");
			
				cur_frm.set_value("status","Return");
				cur_frm.save();
				cur_frm.events.send_notification_to_user(frm);
			}
		});
		d.show();
	},
	approved: function(frm){
		let travel_request_hod_remark_table  = cur_frm.add_child("travel_request_hod_remark_table");

		let d = new frappe.ui.Dialog({
			title: 'Approved Expenses By HOD',
			fields: [
				{
					label: 'Remark',
					fieldname: 'remark',
					fieldtype: 'Small Text',
					"reqd": 1,
				},
			],
			primary_action_label: 'Submit',
			primary_action(values) {
				d.hide();
				var date = frappe.datetime.now_date();
				travel_request_hod_remark_table.remark = (values["remark"]);
				travel_request_hod_remark_table.date = (date);
				travel_request_hod_remark_table.status = ("Approved");
				refresh_field("travel_request_hod_remark_table");

				cur_frm.set_value("status","Approved");
				frappe.call({ 
					async:false,                       
					method: "erpnext.hr.doctype.travel_request.travel_request.view_travel_request_form_admin_user", 
					async:false,
					args: { 
							name:cur_frm.doc.name,
						},	 
				 });
				cur_frm.save();
				cur_frm.events.send_notification_to_user(frm);
				window.location.reload(1);
			}
		});
		d.show();
	},
	approved_request: function(frm){
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.report_to_person_view_travel_request_form", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
					approving_officer : cur_frm.doc.approved_by,
				},	 
		 });
		 cur_frm.set_value("status","To Be Check");
		 cur_frm.save();	
		 cur_frm.events.send_notification_to_user(frm);
	},
	check_remark : function(frm){
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.travel_request_form", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
				},
				callback :function(r){
					var accountantUsers = r.message;
					var currentUserEmail = frappe.session.user;
					var emails = accountantUsers.map(user => user.name);
					if (emails.includes(currentUserEmail)) {
						cur_frm.set_df_property('check_remark', 'read_only', 0);
						cur_frm.enable_save();
					} else {
						cur_frm.set_df_property('check_remark', 'read_only', 1);
					}

				}	 
		 });
	},
	remark: function(){
		if (cur_frm.doc.remark && frappe.session.user === cur_frm.doc.approved_by){
			cur_frm.enable_save();
		}
	},
	from_date: function(frm) {
        if (frm.doc.from_date >frm.doc.to_date) {
			frm.doc.from_date = '';
            frm.refresh_field('from_date');
            frappe.throw('From Date must be less than or equal to To Date');
  
        }
    },
	setup:function(frm){
		frm.set_query('checked_by', function(doc) {
			return {
				filters: {
					"designation": "Accountant",
					"user": doc.user
				},
				
			};
		});
		frm.set_query('administrative_officer', function(doc) {
			return {
				filters: {
					"designation": "Administrative Officer",
					"user": doc.user
				},
				
			};
		});

	},
	send_notification_to_user:function(frm){
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.generate_accountant_notification", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
					name_of_employee : cur_frm.doc.employee_name,
					status : cur_frm.doc.status,
					approving_officer :cur_frm.doc.approved_by,
					prepared_by :cur_frm.doc.prepared_by
				},	 
		 });
	}
});
frappe.ui.form.on("Travel Requisition", {
	date: function(frm, cdt, cdn) {
		var row = locals[cdt][cdn];
		if (row.date){
			if (!(row.date >= cur_frm.doc.from_date && row.date <= cur_frm.doc.to_date)) {
			cur_frm.disable_save();
			frappe.model.set_value(cdt, cdn, 'date', null);
			frappe.throw(__("Date must be equal to or between Form date and End date"));
			
		}else{
			cur_frm.enable_save();
		}
		}
	
	},
	mode:function(frm,cdt,cdn) {
		var d = locals[cdt][cdn];
		frappe.call({
			method: "erpnext.hr.doctype.travel_request.travel_request.get_grade_child_details",
			async:false,
			args: {grade:frm.doc.employee_grade,
				mode: d.mode,
				travelling_start_date:frm.doc.from_date,
			},
			callback: function(r) {
				var options = r.message
				
				var field = frappe.meta.get_docfield(cdt, "class", cdn);
				field.options = null;
				cur_frm.refresh_field("class");
				field.options = [""].concat(options);
				frappe.model.set_value(cdt, cdn, "class", "");
				cur_frm.refresh_field("class");
				frm.refresh_field('travel_requisition');
			}
		})
	},
	
});

cur_frm.cscript.update_status = function(status) {
	frappe.ui.form.is_saving = true;
	
	frappe.call({
		method:"erpnext.hr.doctype.travel_request.travel_request.update_status",
		async:false,
		args: {docname: cur_frm.doc.name, status: status,
			name_of_employee : cur_frm.doc.employee_name,
			approving_officer :cur_frm.doc.approved_by,
			prepared_by :cur_frm.doc.prepared_by
		},
		callback: function(r){

			if(!r.exc){
				cur_frm.reload_doc();
				// window.location.reload(1);

			}
		},
		always: function(){
			frappe.ui.form.is_saving = false;
		}
	})
}

frappe.ui.form.on("Travel Request Accountant Remark Table", {
	remark:function(frm,cdt,cdn) {
		var d = locals[cdt][cdn];
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.travel_request_form", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
				},
				callback :function(r){
					var accountantUsers = r.message;
					var currentUserEmail = frappe.session.user;
					var emails = accountantUsers.map(user => user.name);
					if (emails.includes(currentUserEmail)) {
						cur_frm.set_df_property(d.remark, 'read_only', 0);
						cur_frm.enable_save();
					} else {
						cur_frm.set_df_property(d.remark, 'read_only', 1);
					}
		
				}	 
		 });
	}
})


