//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
  },
});

const Item = mongoose.model("Item", itemSchema);

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

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
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

  // res.render("list", { listTitle: 'Today', newListItems: items });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

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
});

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

// app.post("/:listName", function(req, res){

//   const customListName = _.startCase(_.toLower(req.params.listName))

//   const newItem = new Item({
//     name: req.body.newItem
//   })

//   console.log(newItem);

//   let itemsInList = List.findOne({name: customListName}, function(err, foundItems){
//     if(err){
//       console.log(err)
//     } else {
//       console.log('Successfully found custom list!')
//     }
//   }).items

//   console.log("itemsInList before push: \n" + itemsInList)

//   itemsInList.push(newItem)
//   console.log("itemsInList after push: \n"+itemsInList);

//   List.updateOne({name: customListName}, {items: itemsInList});

//   res.redirect('/'+customListName);
// })

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
