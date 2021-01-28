//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const gym = new Item({
  name: "Gym"
});

const tan = new Item({
  name: "Tan"
});

const laundry = new Item({
  name: "Laundry"
});

const defaultItems = [gym, tan, laundry];

const listsSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listsSchema);

app.get("/", function(req, res) {

  List.findOne({name: ""}, (err, defaultList) => {
    if(err){
      console.log(err);
    } else {
      if(!defaultList){
        list = new List({
          name: "",
          items: defaultItems
        });
        list.save().then(() => {
          res.redirect("/");
          console.log("Created default list");
        });
      } else {
        // Render our list
        res.render("list", {listTitle: "To-Do", newListItems: defaultList.items});
      }
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "To-Do"){
    List.findOne({name: ""}, (err, list) => {
      list.items.push(item);
      list.save().then(() => {
        res.redirect("/");
      });
    });
  } else {
    List.findOne({name: listName}, (err, list) => {
      list.items.push(item);
      list.save().then(() => {
        res.redirect("/list/" + listName);
      });
    });
  }


});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if(listName === "To-Do"){
    // Get default list, then pull from its items array the item which has _id===checkedItemId
    List.findOneAndUpdate({name: ""}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(err){
        console.log(err);
      } else {
        console.log("Successfully deleted item with id " + checkedItemId + " from default list");
      }
      res.redirect("/");
    });
  } else {
    // Find list with name===listName, then pull from its items array the item which has _id===checkedItemId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(err){
        console.log(err);
      } else {
        console.log("Successfully deleted item with id " + checkedItemId + " from " + listName + " list");
      }
      res.redirect("/list/" + listName);
    });
  }


})

app.get("/list/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  if(customListName === _.capitalize("To-Do")){
    // Prevent custom list names that match the default but with different casing
    res.redirect("/");
  } else {
    List.findOne({
      name: customListName
    }, (err, customList) => {
      if (!err) {
        if (!customList) {
          list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save().then(() => {
            res.redirect("/list/" + customListName);
            console.log("Created new list");
          });
        } else {
          res.render("list", {listTitle: customList.name, newListItems: customList.items });
          console.log("Rendering existing list");
        }
      }
      else {
        console.log(err);
      }
    });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
