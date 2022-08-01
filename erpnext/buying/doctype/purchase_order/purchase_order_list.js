frappe.listview_settings['Purchase Order'] = {
	add_fields: ["base_grand_total", "company", "currency", "supplier",
		"supplier_name", "per_received", "per_billed", "status"],
	get_indicator: function (doc) {
		if (doc.status === "Closed") {
			return [__("Closed"), "green", "status,=,Closed"];
		} else if (doc.status === "On Hold") {
			return [__("On Hold"), "orange", "status,=,On Hold"];
		} else if (doc.status === "Delivered") {
			return [__("Delivered"), "green", "status,=,Closed"];
		} else if (flt(doc.per_received, 2) < 100 && doc.status !== "Closed") {
			if (flt(doc.per_billed, 2) < 100) {
				return [__("To Receive and Bill"), "orange",
					"per_received,<,100|per_billed,<,100|status,!=,Closed"];
			} else {
				return [__("To Receive"), "orange",
					"per_received,<,100|per_billed,=,100|status,!=,Closed"];
			}
		} else if (flt(doc.per_received, 2) >= 100 && flt(doc.per_billed, 2) < 100 && doc.status !== "Closed") {
			return [__("To Bill"), "orange", "per_received,=,100|per_billed,<,100|status,!=,Closed"];
		} else if (flt(doc.per_received, 2) >= 100 && flt(doc.per_billed, 2) == 100 && doc.status !== "Closed") {
			return [__("Completed"), "green", "per_received,=,100|per_billed,=,100|status,!=,Closed"];
		}
	},
	onload: function (listview) {
		var method = "erpnext.buying.doctype.purchase_order.purchase_order.close_or_unclose_purchase_orders";

		listview.page.add_menu_item(__("Close"), function () {
			listview.call_for_selected_items(method, { "status": "Closed" });
		});

		listview.page.add_menu_item(__("Re-open"), function () {
			listview.call_for_selected_items(method, { "status": "Submitted" });
		});
	}
};

frappe.listview_settings['Purchase Order'].onload = function(listview) {
	listview.page.actions.find('[data-label="Edit"],[data-label="Assign To"],[data-label="Apply Assignment Rule"], [data-label="Add Tags"]').parent().parent().remove();
};

frappe.listview_settings['Purchase Order'] =
frappe.get_indicator = function(doc, doctype) {
	
	var settings = frappe.listview_settings[doctype] || {};

	var is_submittable = frappe.model.is_submittable(doctype),
		workflow_fieldname = frappe.workflow.get_state_fieldname(doctype);

	// Draft If Document Change The Name is Open
	if(is_submittable && doc.docstatus===0 && !settings.has_indicator_for_draft || doc.po_status === "Open") {
		return [__("Open"), "red", "docstatus,=,0"];
    } else if (doc.po_status === "Proposed Ready Date") {
		return [__("Proposed Ready Date"), "blue", "status,=,Proposed Ready Date"];
	} else if (doc.po_status === "Ready") {
		return [__("Ready"), "green", "status,=,Ready"];
	} else if (doc.po_status === "Shipped") {
		return [__("Shipped"), "purple", "status,=,Shipped"];
	}
}