// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

cur_frm.add_fetch('employee', 'employee_name', 'employee_name');
cur_frm.add_fetch('employee', 'company', 'company');

frappe.ui.form.on("Leave Application", {
	setup: function(frm) {
		frm.set_query("leave_approver", function() {
			return {
				query: "erpnext.hr.doctype.department_approver.department_approver.get_approvers",
				filters: {
					employee: frm.doc.employee,
					doctype: frm.doc.doctype
				}
			};
		});

		frm.set_query("employee", erpnext.queries.employee);
	},
	onload: function(frm) {
		// Ignore cancellation of doctype on cancel all.
		frm.ignore_doctypes_on_cancel_all = ["Leave Ledger Entry"];

		if (!frm.doc.posting_date) {
			frm.set_value("posting_date", frappe.datetime.get_today());
		}
		if (frm.doc.docstatus == 0) {
			return frappe.call({
				method: "erpnext.hr.doctype.leave_application.leave_application.get_mandatory_approval",
				args: {
					doctype: frm.doc.doctype,
				},
				callback: function(r) {
					if (!r.exc && r.message) {
						frm.toggle_reqd("leave_approver", true);
					}
				}
			});
		}
	},

	validate: function(frm) {
		if (frm.doc.from_date == frm.doc.to_date && frm.doc.half_day == 1) {
			frm.doc.half_day_date = frm.doc.from_date;
		} else if (frm.doc.half_day == 0) {
			frm.doc.half_day_date = "";
		}
		frm.toggle_reqd("half_day_date", frm.doc.half_day == 1);
	},

	make_dashboard: function(frm) {
		var leave_details;
		let total_available;
		let applied_leave;
		let allocation_value;
		let balance;
		let lwps;
		var positiveBalanceAllocation;
	
		if (frm.doc.employee && frm.doc.from_date && frm.doc.to_date && frm.doc.leave_type ) {
			frappe.call({
				method: "erpnext.hr.doctype.leave_application.leave_application.get_leave_details",
				async: false,
				args: {
					employee: frm.doc.employee,
					date: frm.doc.from_date || frm.doc.posting_date,
					to_date: frm.doc.to_date,
					leave_type:frm.doc.leave_type
				},
				callback: function(r) {
					if (!r.exc && r.message['leave_allocation']) {
						
						leave_details = r.message['leave_allocation'];

						total_available = r.message['total_available'];
						allocation_value = r.message['allocation_value'];
						
						applied_leave = r.message['applied_leave'];
						balance = r.message['balance'];
						positiveBalanceAllocation =(balance - allocation_value);
						if (positiveBalanceAllocation < 0) {
							positiveBalanceAllocation = 0;
						}
						
						
						frm.doc.total_available = total_available;
						frm.doc.monthly_allocated_leaves = allocation_value;
						frm.doc.total_used_leaves = applied_leave;
						frm.doc.balance = balance;
	
						frm.refresh_field('total_available');
						frm.refresh_field('monthly_allocated_leaves');
						frm.refresh_field('total_used_leaves');
						frm.refresh_field('balance');
						
					}
	
					if (!r.exc && r.message['leave_approver']) {
						frm.set_value('leave_approver', r.message['leave_approver']);
					}
					lwps = r.message["lwps"];
				}
			});
			$("div").remove(".form-dashboard-section.custom");
			frm.dashboard.add_section(
				frappe.render_template('leave_application_dashboard', {
					data: leave_details,
					total_available: total_available,
					applied_leave: applied_leave,
					allocation_value: allocation_value,
					positiveBalanceAllocation: positiveBalanceAllocation,
				}),
				__("Allocated Leaves")
			);
			frm.dashboard.show();
			let allowed_leave_types = Object.keys(leave_details );
			

			// lwps should be allowed, lwps don't have any allocation
			allowed_leave_types = allowed_leave_types.concat(lwps);

			frm.set_query('leave_type', function() {
				return {
					filters: [
						['leave_type_name', 'in', allowed_leave_types]
					]
				};
			});
		}
	},

	refresh: function(frm) {
		frm.dashboard.links_area.hide();
		if (frm.is_new()) {
			frm.trigger("calculate_total_days");
		}
		cur_frm.set_intro("");
		if (frm.doc.__islocal && !in_list(frappe.user_roles, "Employee")) {
			frm.set_intro(__("Fill the form and save it"));
		}

		if (!frm.doc.employee && frappe.defaults.get_user_permissions()) {
			const perm = frappe.defaults.get_user_permissions();
			if (perm && perm['Employee']) {
				frm.set_value('employee', perm['Employee'].map(perm_doc => perm_doc.doc)[0]);
			}
		}
	},

	employee: function(frm) {
		frm.trigger("make_dashboard");
		frm.trigger("get_leave_balance");
		frm.trigger("set_leave_approver");
	},

	leave_approver: function(frm) {
		if (frm.doc.leave_approver) {
			frm.set_value("leave_approver_name", frappe.user.full_name(frm.doc.leave_approver));
		}
	},

	leave_type: function(frm) {
		frm.trigger("get_leave_balance");
	},

	half_day: function(frm) {
		if (frm.doc.half_day) {
			if (frm.doc.from_date == frm.doc.to_date) {
				frm.set_value("half_day_date", frm.doc.from_date);
			} else {
				frm.trigger("half_day_datepicker");
			}
		} else {
			frm.set_value("half_day_date", "");
		}
		frm.trigger("calculate_total_days");
	},

	from_date: function(frm) {
		frm.trigger("make_dashboard");
		frm.trigger("half_day_datepicker");
		frm.trigger("calculate_total_days");
	},

	to_date: function(frm) {
		frm.trigger("make_dashboard");
		frm.trigger("half_day_datepicker");
		frm.trigger("calculate_total_days");
		
	},

	half_day_date(frm) {
		frm.trigger("calculate_total_days");
	},

	half_day_datepicker: function(frm) {
		frm.set_value('half_day_date', '');
		var half_day_datepicker = frm.fields_dict.half_day_date.datepicker;
		half_day_datepicker.update({
			minDate: frappe.datetime.str_to_obj(frm.doc.from_date),
			maxDate: frappe.datetime.str_to_obj(frm.doc.from_date),
		
		});
		half_day_datepicker.update({
			minDate: frappe.datetime.str_to_obj(frm.doc.to_date),
			maxDate: frappe.datetime.str_to_obj(frm.doc.to_date),
		
		});
	},

	get_leave_balance: function(frm) {
		if (frm.doc.docstatus === 0 && frm.doc.employee && frm.doc.leave_type && frm.doc.from_date && frm.doc.to_date) {
			return frappe.call({
				method: "erpnext.hr.doctype.leave_application.leave_application.get_leave_balance_on",
				args: {
					employee: frm.doc.employee,
					date: frm.doc.from_date,
					to_date: frm.doc.to_date,
					leave_type: frm.doc.leave_type,
					consider_all_leaves_in_the_allocation_period: 1
				},
				callback: function (r) {
					if (!r.exc && r.message) {
						frm.set_value('leave_balance', r.message);
					} else {
						frm.set_value('leave_balance', "0");
					}
				}
			});
		}
	},

	calculate_total_days: function(frm) {
		if (frm.doc.from_date && frm.doc.to_date && frm.doc.employee && frm.doc.leave_type) {

			var from_date = Date.parse(frm.doc.from_date);
			var to_date = Date.parse(frm.doc.to_date);
	
			if (to_date < from_date) {
				frappe.msgprint(__("To Date cannot be less than From Date"));
				frm.set_value('to_date', '');
				return;
			}
			// server call is done to include holidays in leave days calculations
			return frappe.call({
				method: 'erpnext.hr.doctype.leave_application.leave_application.number_of_leave_days',
				args: {
					"employee": frm.doc.employee,
					"leave_type": frm.doc.leave_type,
					"from_date": frm.doc.from_date,
					"to_date": frm.doc.to_date,
					"half_day": frm.doc.half_day,
					"half_day_date": frm.doc.half_day_date,
				},
				callback: function(r) {
					if (r && r.message) {
						frm.set_value('total_leave_days', r.message);
						frm.trigger("get_leave_balance").then(function () {
						var leave_balance = frm.doc.leave_balance;
	
						var total_available = frm.doc.total_available || 0;
						var total_leave_days = frm.doc.total_leave_days || 0;
						if (total_available < 0) {
							total_available = 0;
						}
	
						if (total_leave_days > total_available) {
							var lwp_count = total_leave_days - total_available;
							frm.set_value('lwp_count', lwp_count);
						} else {
							frm.set_value('lwp_count', 0);
						}
						
						var current_leave_type_count = frm.doc.total_leave_days - frm.doc.lwp_count;
						if (current_leave_type_count < 0) {
							current_leave_type_count = 0;
						}
						if (current_leave_type_count > leave_balance) {
						    var excess_leave = current_leave_type_count - leave_balance;
						    current_leave_type_count -= excess_leave;
						    frm.set_value('lwp_count', frm.doc.lwp_count + excess_leave);
						}
						
						frm.doc.current_leave_type_count = current_leave_type_count;
						frm.refresh_field('current_leave_type_count');
					});

					}
				}
			});
		}
	},
	

	set_leave_approver: function(frm) {
		if (frm.doc.employee) {
			// server call is done to include holidays in leave days calculations
			return frappe.call({
				method: 'erpnext.hr.doctype.leave_application.leave_application.get_leave_approver',
				args: {
					"employee": frm.doc.employee,
				},
				callback: function(r) {
					if (r && r.message) {
						frm.set_value('leave_approver', r.message);
					}
				}
			});
		}
	}
});
frappe.ui.form.on('Leave Application', {
    employee: function (frm) {
        var employee_input = frm.doc.employee;
        if (employee_input) {
            frappe.call({
                method: 'erpnext.hr.doctype.leave_application.leave_application.get_allowed_leave_types',
                args: { employee_input: employee_input },
                callback: function (r) {
                    if (r.message) {
                        var allowed_leave_types_for_employee = r.message;
						
                        // Clear existing options in the leave_type dropdown
                        frm.fields_dict['leave_type'].get_query = function () {
                            return {
                                filters: [
                                    ['Leave Type', 'name', 'in', allowed_leave_types_for_employee]
                                ]
                            };
                        };

                        frm.fields_dict['leave_type'].refresh();
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('Leave Application', {
    refresh: function(frm) {
		const cancelButton = document.querySelector('.btn.btn-secondary.btn-default.btn-sm');
		if (cancelButton) {
			cancelButton.style.display = 'none';
		}


        if (!frm.doc.__islocal) {
            if (frm.doc.status === 'Cancelled' ) {
                // If status is 'Cancelled', don't add any buttons
                return;
            }
            
            if ((frm.doc.status == 'Open' || frm.doc.status == 'Approved') && frappe.session.user == frm.doc.leave_approver) {
                if (frm.doc.status == 'Approved') {
					frm.add_custom_button(__('Rejected'), function() {
                        frappe.confirm(
                            __('Are you sure you want to reject this leave application?'),
                            function() {
                                frm.set_value('status', 'Rejected');
                                frm.save();
                            }
                        );
                    }, __("Status"));
                } else {
                    frm.add_custom_button(__('Approved'), function(){
                        frm.set_value('status', 'Approved');
                        frm.save();
                    }, __("Status"));
                    frm.add_custom_button(__('Rejected'), function() {
                        frappe.confirm(
                            __('Are you sure you want to reject this leave application?'),
                            function() {
                                frm.set_value('status', 'Rejected');
                                frm.save();
                            }
                        );
                    }, __("Status"));
                }
            } else {
                frm.add_custom_button(__('Cancelled'), function() {
					frappe.confirm(
						__('Are you sure you want to Cancel this leave application?'),
						function() {
								if (frm.doc.docstatus === 1) {
									// Document status is 1 (Submitted), proceed to cancel attendance records
									frappe.call({
										method: 'erpnext.hr.doctype.leave_application.leave_application.cancel_attendance_records',
										args: {
											leave_application: frm.doc.name
										},
										callback: function(response) {
											response.message === 'success'
											setTimeout(function() {
												window.location.reload();
											}, 4000);
											frappe.msgprint(__('Your available leave days have been credited to your account.'));
										}
									});
								} else {
									frm.set_value('status', 'Cancelled');
									frm.save();
								}
						}
					);
				}, __("Status"));
				
				
            }
        }
    }
});
frappe.ui.form.on('Leave Application', {
    refresh: function(frm) {
        // Get the div element with the class "menu-btn-group" and hide it
        var menuBtnGroup = document.querySelector('.menu-btn-group');
        if (menuBtnGroup) {
            menuBtnGroup.style.display = 'none';
        }
    }
});
frappe.ui.form.on('Leave Application', {
    refresh: function(frm) {
        // Get the form status (replace 'status' with the actual fieldname of your form status)
        var formStatus = frm.doc.status;
        // Check the form status and toggle the button's visibility
        if (formStatus === 'Rejected' || formStatus === 'Approved') {
            // Show the button if it's hidden
            var submitButton = document.querySelector('[data-label="Submit"]');
            if (submitButton.style.display === 'none') {
                submitButton.style.display = 'block';
            }
        } else {
            // Hide the button
            var submitButton = document.querySelector('[data-label="Submit"]');
            submitButton.style.display = 'none';
			var saveButton = document.querySelector('[data-label="Save"]');
			saveButton.style.display = 'block';
        }
    }
});


frappe.tour["Leave Application"] = [
	{
		fieldname: "employee",
		title: "Employee",
		description: __("Select the Employee.")
	},
	{
		fieldname: "leave_type",
		title: "Leave Type",
		description: __("Select type of leave the employee wants to apply for, like Sick Leave, Privilege Leave, Casual Leave, etc.")
	},
	{
		fieldname: "from_date",
		title: "From Date",
		description: __("Select the start date for your Leave Application.")
	},
	{
		fieldname: "to_date",
		title: "To Date",
		description: __("Select the end date for your Leave Application.")
	},
	{
		fieldname: "half_day",
		title: "Half Day",
		description: __("To apply for a Half Day check 'Half Day' and select the Half Day Date")
	},
	{
		fieldname: "leave_approver",
		title: "Leave Approver",
		description: __("Select your Leave Approver i.e. the person who approves or rejects your leaves.")
	}
];
