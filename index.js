//jshint esversion:6
require('dotenv').config({ path: '.env' })
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const _ = require('lodash');
const uri = process.env.MONGO_URI;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(uri);
//const items = [];
//const workItems = [];

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const item4 = new Item ({
  name: "The Fourth Item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}).then((foundItems) => {
    if (foundItems.length > 0) {
     res.render("list", {listTitle: "Today", newListItems: foundItems});
    } else {
      Item.insertMany(defaultItems).then(function(){
        console.log("Successfully saved all the items to the database");
      }).catch(function(err){
        console.log(err);
      });
      res.redirect("/");
     }
  }); 
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {  
    List.findOne({name: listName}).then((foundList) => { 
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });    
  };
});  

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName[0];
  console.log(checkedItemId);
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function(){
        console.log("Successfully deleted checked item.");
        res.redirect("/"); 
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(){
      res.redirect("/" + listName);
    }); 
  }  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:listName", function(req,res){
  const listName = req.params.listName;
  List.findOne({name: _.capitalize(listName)}).then((foundList) => {
    if (!foundList) {
      const list = new List ({
      name: listName,
      items: defaultItems
      });
      list.save();
      res.redirect("/" + listName ); 
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }  
  });  
});  

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
