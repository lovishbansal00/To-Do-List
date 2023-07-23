const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

// creating express app
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// fetching date
var options = { weekday: 'long', day: 'numeric', month: 'long' };
var today = new Date();
var day = today.toLocaleDateString("en-US", options);


// connecting to database
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

// creating schema
const itemsSchema = {
    name: String
};

const ListSchema = {
    name: String,
    items: [itemsSchema]
};

// creating model
const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', ListSchema);

// default items
const Item1 = new Item({
    name: 'Welcome to your todolist!'
});
const Item2 = new Item({
    name: 'Hit the + button to add a new item.'
});
const Item3 = new Item({
    name: '<-- Hit this to delete an item.'
});
const defaultItems = [Item1, Item2, Item3];


// home route 
app.get('/', (req, res) => {
    Item.find({}).then((foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems).then(() => {
                console.log('Successfully saved default items to DB.');
            }).catch((err) => {
                console.log(err);
            });
            res.redirect('/');
        }
        else
            res.render('list', { listTitle: day, newListItems: foundItems });
    }).catch((err) => {
        console.log(err);
    });

});


// custom route
app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }).then((foundList) => {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect('/' + customListName);
        }
        else
            res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
    }).catch((err) => {
        console.log(err);
    });
})


// post route
app.post('/', (req, res) => {
    let itemName = req.body.newItem;
    let listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        item.save();
        res.redirect('/' + listName);
    } else {
        List.findOne({ name: listName }).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
        }).catch((err) => {
            console.log(err);
        });
        res.redirect('/' + listName);
    }
});


// delete route
app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listname = req.body.listName;

    if (listname === day) {
        Item.findByIdAndDelete(checkedItemId).then(() => {
            console.log('Successfully deleted item from DB.');
        }).catch((err) => {
            console.log(err);
        });
        res.redirect('/' + listname);
    }
    else {
        List.findOneAndUpdate({ name: listname }, { $pull: { items: { _id: checkedItemId } }, }, { useFindAndModify: false }).then(() => {
            console.log('Successfully deleted item from DB.');
        }).catch((err) => {
            console.log(err);
        });
        res.redirect('/' + listname);
    }
});


// listening to port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000.');
})