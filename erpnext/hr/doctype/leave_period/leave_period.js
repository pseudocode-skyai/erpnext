// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Leave Period', {
	from_date: (frm)=>{
		if (frm.doc.from_date && !frm.doc.to_date) {
			var a_year_from_start = frappe.datetime.add_months(frm.doc.from_date, 12);

			var date = frappe.datetime.add_days(a_year_from_start, -1)
			frm.set_value("to_date", date);
			var date_to = frm.events.change_date_format(date);
			frm.set_value("date_to", date_to);
			var date_from = frm.events.change_date_format(cur_frm.doc.from_date);
			frm.set_value("date_from", date_from);
		}
	},
	change_date_format(date){
		var components = date.split("-");
		var year = components[0];
		var month = components[1];
		var day = components[2];
		var formattedDate = day + "-" + month + "-" + year;
		console.log(formattedDate);
		return formattedDate;
	},
	to_date: (frm)=>{
		var date_to = frm.events.change_date_format(cur_frm.doc.to_date);
		frm.set_value("date_to", date_to);
	},
	onload: (frm) => {
		frm.set_query("department", function() {
			return {
				"filters": {
					"company": frm.doc.company,
				}
			};
		});
	},
});
