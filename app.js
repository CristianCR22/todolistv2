const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');
app.use(express.urlencoded());
app.use(express.static(__dirname + "/public"));

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/todolistDB');
}

const itemSchema= new mongoose.Schema ({
  name: {
    type: String,
    required:true
  }
});

const Item = new mongoose.model ("Item", itemSchema);

const item1 = new Item ({
  name: 'Welcome to your todolist'
});

const item2 = new Item ({
  name: 'Hit de + button to add a new item.'
});

const item3 = new Item ({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = new mongoose.model ("List", listSchema);



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany([item1, item2, item3], function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Items successfully added!");
          }
        });
        res.redirect("/");
      } else {
        res.render('list', {listTitle: 'Today', newListItem: foundItems});
      }
    }
  });
});

app.get("/:list", function(req,res){
  const listType = _.capitalize(req.params.list);

  List.findOne({name: listType}, function(err, result){
    if (!err) {
      if (!result){
        const list = new List({
          name: listType,
          items: defaultItems
        });
        list.save();
        setTimeout(() => { res.redirect('/' + listType);}, 2000);
      } else {
        res.render("list", {listTitle: result.name, newListItem: result.items});
      }
    }
  });
});



app.post("/",function(req, res){
  const newItem = req.body.newItem;
  const listName = req.body.submit;

  const addItem = new Item ({
    name: newItem
  });

  if (listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(addItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  const checkboxItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.deleteOne({_id: checkboxItemId}, function(err){
      if(err){
        console.log(err);
      } else {
      console.log("Element deleted");
    }});
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxItemId}}}, function(err,result) {
      if(!err){
        res.redirect("/" + listName);
      }
    } );
  }

});



app.listen(3000, function() {
  console.log("Server running on port 3000.");
})

// <% for (let i = 0; i < newListItem.length; i++) { %>
// <div class="item">
//   <input type="checkbox">
//   <p><%=  newListItem[i].name %></p>
// </div>
// <% } %>
