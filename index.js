import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
dotenv.config()
const app = express()
const { Schema } = mongoose;

// database related stuff
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const exerciseSchema = new Schema({
  _id: {
    type: String,
    default: nanoid()
  },
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true,
    default: new Date().toDateString()
  }
})

const userSchema = new Schema({
  _id: {
    type: String,
    default: nanoid()
  },
  username: {
    type: String,
    required: true
  }
})

const logSchema = new Schema({
  _id: false,
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true,
    default: new Date().toDateString()
  }
})

const logsSchema = new Schema({
  _id: {
    type: String,
    default: nanoid()
  },
  username: {
    type: String
  },
  count: {
    type: Number,
    default: 0
  },
  log: {
    type: [logSchema]
  }
})

const Exercise = mongoose.model('Exercise', exerciseSchema)
const User = mongoose.model('User', userSchema)
const Log = mongoose.model('Log', logSchema)
const Logs = mongoose.model('Logs', logsSchema)

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
})

app.post('/api/users', async (req, res) => {
  const newUser = new User({
    _id: nanoid(),
    username: req.body.username
  })
  newUser.save((err, user) => {
    if (err) console.log(err)
    res.json({_id: user._id, username: user.username});
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  User.findById({_id: req.params._id}, async (err, user) => {
    if (err) console.og(err)
    const newExercise = new Exercise({
      _id: nanoid(),
      description: req.body.description,
      duration: req.body.duration,
      date: new Date(req.body.date).toDateString(),
      username: user.username
    })
    Logs.findOne({username: user.username}, async (err, logDoc) => {
      if (err) console.log(err)
      if (!logDoc) {
        let count = 0
        count++
        const newLog = new Logs({
          _id: user._id,
          username: user.username,
          count
        })
        newLog.log.push({
          description: req.body.description,
          duration: req.body.duration,
          date: new Date(req.body.date).toDateString()
        })
        await newLog.save()
      } else {
        logDoc.count = logDoc.count + 1
        logDoc.log.push({
          description: req.body.description,
          duration: req.body.duration,
          date: new Date(req.body.date).toDateString()
        })
        logDoc.save()
      }
    })
    await newExercise.save((err, exercise) => {
      if (err) console.log(err)
      res.json({_id: user._id, description: exercise.description, duration: exercise.duration, date: exercise.date, username: exercise.username})
    })
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit
  
  Logs.findOne({_id: req.params._id}, '_id username count log', (err, doc) => {
    if (err) console.log(err)
    res.json(doc)
  })
})

mongoose.connection.on('open', () => {
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  })
})

