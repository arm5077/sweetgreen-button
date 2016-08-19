exports.handler = function(event, context){
  var request = require('request');
  var cookies = request.jar();
  var request = request.defaults({jar: cookies})

  // Object for Guacamole Greens salad
  var guac_greens = {
    line_item:{
        quantity:"1",
        custom_name:"andrew's special guac with no onions success",
        product_id:"134",
        options:[{
            id:"13929",
            name:"remove red onion",
            out_of_stock:false,
            quantity:"1",
            parent_option_group_id:"973",
            option_group_ids:["975"],
            ingredient_id:"64",
          },
          {
            id:"13941",
            name:"sub raw corn",
            out_of_stock:false,
            quantity:"1",
            parent_option_group_id:"975",
            option_group_ids:[],
            ingredient_id:"61",line_item_id:null
          }],
        restaurant_id:"6"
      }
  };

  // Object for Harvest Bowl salad
  var harvest_bowl = {
  	"line_item": {
  		"quantity": 1,
  		"calories": 705,
  		"custom_name": null,
  		"product_id": "139",
  		"restaurant_id": "6"
  	}
  }
  
  // Object for OMG Omega salad
  var omg_omega = {
  	"line_item": {
  		"quantity": 1,
  		"calories": 555,
  		"custom_name": null,
  		"product_id": "1748",
  		"restaurant_id": "6"
  	}    
  }
  

  // Choose a random salad
  var salad = [guac_greens, harvest_bowl, omg_omega][Math.floor(Math.random() * 3)];

  // Log in
  request.post({
    url: "https://order.sweetgreen.com/api/customers/login_or_register",
    form:{
      customer: {email: INSERT_EMAIL_HERE, password: INSERT_PASSWORD_HERE} 
    }
  }, function(err, response, body){
    if(err) throw err;

    // Grab session data and save billing info
    var session = JSON.parse(body);
    var contact_number = session.customers[0].contact_number
    var billing_account_id = session.customers[0].billing_account_ids[0]
    var billing_account = session.billing_accounts[0];
  
    // Add salad to shopping bag
    request.post({
      url: "https://order.sweetgreen.com/api/line_items",
      body: salad,
      json: true
    }, function(err, response, body){
      if(err) throw err;

      var order_id = body.line_item.ignored_order_id

      // Get final order object and prepare to send
      request.get("https://order.sweetgreen.com/api/session", function(err, response, body){
        var orders = JSON.parse(body).orders;
        var order = orders.filter(function(d){ return d.id == order_id })[0];
        order.contact_number = contact_number;
        order.billing_account_id = billing_account_id;
        order.wanted_time = order.available_wanted_times_tuples[0].original
        order.state = "complete";
        order.billing_account = billing_account;
      
        request.put({
          url: "https://order.sweetgreen.com/api/orders/" + order_id,
          body: { order: order },
          json: true
        }, function(err, response, body){
          if(err) throw err;
          console.log("did it!")
          context.done()
        });
      })    
    });
  });
}