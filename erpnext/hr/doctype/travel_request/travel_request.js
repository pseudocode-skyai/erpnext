// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt


frappe.ui.form.on("Travel Request", {

	employee: function(frm) {
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.get_employee_doc", 
			args: { 
				employee:frm.doc.employee,
			},
			callback: function(r) {
				if( r.message == 1){
                    cur_frm.disable_save();
                    frappe.throw(__("Please set Travel Expense Approving Officer and Travel Expense Checking Officer for the Employee: " + frm.doc.employee));
                }else if( r.message == 2){
					cur_frm.disable_save();
                    frappe.throw(__("Please set Travel Expense Checking Officer for the Employee: " + frm.doc.employee));
				}else if( r.message == 3){
					cur_frm.disable_save();
                    frappe.throw(__("Please set Travel Expense Approving Officer for the Employee: " + frm.doc.employee));
				}else{cur_frm.enable_save();}
			}
		})
	},

	to_date: function(frm) {
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.get_doc", 
			args: { 
				travelling_start_date:frm.doc.from_date,
				travelling_end_date:frm.doc.to_date,
				grade:frm.doc.employee_grade
				}
		})
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
					cur_frm.add_custom_button(__('Approved Request'), () => cur_frm.events.approved_request(), __("Status"));
				}
				if (frm.doc.status == "Send For Approval") {
					cur_frm.disable_save();				
				}				
			}

		}
		if (frappe.session.user === cur_frm.doc.approved_by) {
			if (frm.doc.status == "Send For Approval" ){
				cur_frm.add_custom_button(__('Check'), () => cur_frm.events.checking(), __("Status"));
			}
			if (frm.doc.status == "To Be Approved" || frm.doc.status == "Send For Approval"){
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

		}
		if (frappe.session.user === cur_frm.doc.checked_by) {
			// if (frm.doc.check_remark){
			
			// 	$('.primary-action').prop('disabled', false);
			// }
			if (doc.status == "Send For Approval" ){
				cur_frm.add_custom_button(__('Check'), () => cur_frm.events.checking(), __("Status"));
			}
		}
	},
	checking: function(){
		
		let d = new frappe.ui.Dialog({
			title: 'Remark',
			fields: [
				{
					label: 'Remark',
					fieldname: 'remark',
					fieldtype: 'Small Text'
				},
			],
			primary_action_label: 'Submit',
			primary_action(values) {
				cur_frm.set_value("status","To Be Approved");
				cur_frm.set_value('check_remark', (values["remark"]));
				cur_frm.refresh_field('check_remark');
				d.hide();
				cur_frm.save();
				cur_frm.reload();	
			}
		});
		d.show();
	},
	reject: function(){
		cur_frm.set_value("status","Reject");
		cur_frm.save();
		setTimeout(function(){
			window.location.reload(1);
		}, 500);
	},
	return: function(){
		cur_frm.set_value("status","Return");
		cur_frm.save();
	},
	approved: function(){
		let d = new frappe.ui.Dialog({
			title: 'Approved Expenses By HOD',
			fields: [
				{
					label: 'Remark',
					fieldname: 'remark',
					fieldtype: 'Small Text'
				},
			],
			primary_action_label: 'Submit',
			primary_action(values) {
				d.hide();
				cur_frm.set_value("status","Approved");
				cur_frm.set_value('remark', (values["remark"]));
				cur_frm.refresh_field('remark');
				cur_frm.save();
				cur_frm.reload();	
			}
		});
		d.show();
	},
	approved_request: function(){
		frappe.call({                        
			method: "erpnext.hr.doctype.travel_request.travel_request.report_to_person_view_travel_request_form", 
			async:false,
			args: { 
					name:cur_frm.doc.name,
					approving_officer : cur_frm.doc.approved_by,
					checking_officer : cur_frm.doc.checked_by,
				},	 
		 });
		 cur_frm.set_value("status","Send For Approval");
		 cur_frm.save();	
	},
	check_remark : function(){
		if (cur_frm.doc.check_remark && frappe.session.user === cur_frm.doc.checked_by){
			cur_frm.enable_save();
		}else if (cur_frm.doc.check_remark){
			cur_frm.disable_save();
			window.location.reload();
		}
	},
	remark: function(){
		if (cur_frm.doc.remark && frappe.session.user === cur_frm.doc.approved_by){
			cur_frm.set_df_property('check_remark', 'read_only', 1);
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
	to_date: function(frm) {
        if (frm.doc.to_date <frm.doc.from_date) {
			frm.doc.to_date = '';
            frm.refresh_field('to_date');
			frappe.throw('To Date must be greater than or equal to From Date');
           
        }
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
				travelling_end_date:frm.doc.to_date
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
