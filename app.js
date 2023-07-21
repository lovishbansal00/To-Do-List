const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var options = { weekday: 'long', day: 'numeric', month: 'long' };
var today = new Date();
var day = today.toLocaleDateString("en-US", options);

mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
    name: String
};

const ListSchema = {
    name: String,
    items: [itemsSchema]
};

const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', ListSchema);

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

let items = [];
let workItems = [];

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

app.get('/:customListName', (req, res) => {
    const customListName = req.params.customListName;
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

app.post('/', (req, res) => {
    let itemName = req.body.newItem;
    let listName = req.body.list;

    if (listName === day) {

    }

    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        item.save();
        res.redirect('/');
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

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listname = req.body.listname;

    Item.findByIdAndDelete(checkedItemId).then(() => {
        console.log('Successfully deleted item from DB.');
    }).catch((err) => {
        console.log(err);
    });
    res.redirect('/');

});


app.listen(3000, () => {
    console.log('Server is running on port 3000.');
})