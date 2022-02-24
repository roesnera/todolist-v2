//jshint esversion:6

// requires all modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

// instantiates our server
const app = express();

// allows us to use ejs for our html pages
app.set("view engine", "ejs");

// tells our server to use bodyparser for request body parsing and adds the public folder as an accessible directory
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connects to our moongo db using mongoose, using the todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB");

// creates scheme for our items
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
  },
});

// creates collection connection using our itemSchema in a collection called Items for our master list
const Item = mongoose.model("Item", itemSchema);


// This section creates default list items and adds them to an array for easy adding later on
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];


// Creates a scheme for our alternate lists to include a name field and an array of items
const listSchema = {
  name: String,
  items: [itemSchema]
}

// Creates a collection connection using our listSchema in a collection called Lists for our niche lists
const List = mongoose.model("List", listSchema);


// get mapping for our root route
app.get("/", function (req, res) {

  // returns all items in our Items collection, if none then loads and saves defaultItems
  Item.find({}, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      if (found.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added item!");
          }
        });
        res.redirect("/");
      } else {
        // console.log(found);
        res.render("list", { listTitle: "Today", newListItems: found });
      }
    }
  });
});


// post mapping for all list routes, root and niche.  Redirects to route based on request body "list" value
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });
  try{
  if(listName === "Today"){

    newItem.save();
  
    res.redirect("/");

  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/'+listName);
    })
  }
} catch(err){
  console.log('invalid input')
  if(listName == "Today"){
    res.redirect('/')
  } else {
    res.redirect('/'+listName)
  }
}
});


// post mapping for all delete button requests. Removes item with id equal to request body "checkbox" value from collection or list specified by request body "listName" value and redirects based on same value.
app.post("/delete/", function (req, res) {
  console.log(req.body.checkbox);
  let itemToDelete = req.body.checkbox;
  let listTitle = req.body.listName;

  if(listTitle === 'Today'){
    Item.findByIdAndRemove(itemToDelete, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully removed item!");
      res.redirect("/");
    }
  });
  } else {
    List.findOneAndUpdate({name: listTitle}, { $pull: { items: {_id: itemToDelete}}}, function(err, foundList){
      if(err){
        console.log(err)
      } else {
        console.log('Successfully $pulled item from list!')
      }
    })
    res.redirect('/'+listTitle);
  }

  
});


// get mapping for niche lists. Should always load some values, if new list default values, if extant then whatever is already saved. Having trouble when you delete all values but not a huge deal.
app.get("/:listName", function (req, res) {

  const customListName = _.startCase(_.toLower(req.params.listName))

  if(customListName == 'Favicon Ico'){
    res.redirect('/')
  }

  const list = new List({
    name: customListName,
    items: defaultItems
  })

  List.find({name: customListName}, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      console.log(found)
      if (found.length === 0) {
        list.save()
        res.redirect('/'+customListName)
      // } else if(found[0].items.length === 0){
      //   List.findOneAndUpdate({name: customListName}, { $push: {items: defaultItems}});
      //   res.redirect('/'+customListName);
      } else {
        // console.log(found[0].items);
        res.render("list", { listTitle: found[0].name, newListItems: found[0].items });
      }
    }
  });
});


// get mapping for about route. Renders our about page.
app.get("/about", function (req, res) {
  res.render("about");
});

// starts our server.
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
