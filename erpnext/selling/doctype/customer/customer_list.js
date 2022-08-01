frappe.listview_settings['Customer'] = {
	add_fields: ["customer_name", "territory", "customer_group", "customer_type", "image"],
	hide_name_column: true,
    onload: function(me) {
      me.$page.find(`div[data-fieldname='name']`).addClass('hide');
      me.$page.find(`div[data-fieldname='customer_group']`).addClass('hide');
      me.$page.find(`div[data-fieldname='territory']`).addClass('hide');
      }
};
