<?php

Route::group(['prefix' => 'support'], function(){

	Route::resource('support-tickets','Api\SupportTicketController')->names([
		'destroy' => 'support-tickets.resource.destroy',
	]);
	Route::get('/my-ticket', 'Api\SupportTicketController@my_ticket')->name('support-tickets.my_ticket');
	Route::get('/solved-ticket', 'Api\SupportTicketController@solved_ticket')->name('support-tickets.solved_ticket');
	Route::get('/active-ticket', 'Api\SupportTicketController@active_ticket')->name('support-tickets.active_ticket');
	Route::post('support-ticket/agent/reply', 'Api\SupportTicketController@ticket_reply')->name('support-ticket.admin_reply');
	Route::get('/support-ticket/destroy/{id}', 'Api\SupportTicketController@destroy')->name('support-tickets.destroy');


	// deafult staff for assigning ticket
	Route::get('/default-ticket-assigned-agent', 'Api\SupportTicketController@default_ticket_assigned_agent')->name('default_ticket_assigned_agent');

	// Support categories
	// Route::resource('support-categories','SupportCategoryController');
	// Route::get('/support-categories/destroy/{id}', 'SupportCategoryController@destroy')->name('support_categories.destroy');

});


Route::get('support-ticket/create', 'Api\SupportTicketController@user_ticket_create')->name('support-tickets.user_ticket_create');
Route::post('support-ticket/store', 'Api\SupportTicketController@store')->name('support-ticket.store');
Route::post('support-ticket/user-reply', 'Api\SupportTicketController@ticket_reply')->name('support-ticket.user_reply');
Route::get('support-ticket/history', 'Api\SupportTicketController@user_index')->name('support-tickets.user_index');
Route::get('support-ticket/view-details/{id}', 'Api\SupportTicketController@user_view_details')->name('support-tickets.user_view_details');


?>
