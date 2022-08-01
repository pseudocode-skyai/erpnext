
frappe.listview_settings['Item Price'] = {
    hide_name_column: true,
    onload: function(me) {
      me.$page.find(`div[data-fieldname='name']`).addClass('hide');
      }
}