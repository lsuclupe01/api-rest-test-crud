const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')

const movies = require ('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')


const app = express()
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
            'http://movies.com',
            'http://mide.dev'
        ]
        if(ACCEPTED_ORIGINS.includes(origin)){
            return callback(null,true)
        }
        if(!origin){
            return callback(null,true)
        }
        return callback(new Error('Not allowed by CORS - Revisar lista'))
    } 

}))
app.disable('x-powered-by')
//metodo normales GET/HEAD/POST
//metodos complejos PUT/PATH/DELETE

//CORS PRE-Fligth
//OPTIONS

app.get('/', (req, res) =>{    
    res.json({message : 'Hola mundo'})    
})
 


app.get('/movies', (req, res)=>{
    /*
    const origin = req.header('origin')    
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin',origin)    
    } 
    */   
    const {genre} = req.query
    if(genre){
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies) 
})

app.get('/movies/:id', (req, res) =>{ // path to regexp
    const {id} = req.params
    const movie = movies.find(movie => movie.id === id)
    if(movie) return res.json(movie) 

    res.status(404).json({message: 'Movie not found'})    
})

app.post('/movies', (req, res)=>{
    const result = validateMovie(req.body)
    if(result.error){
      return res.status(422).json({error: JSON.parse(result.error.message)})
    }
    //Base de datos
    const newMovie = {
        id: crypto.randomUUID(), // UUID v4
        ...result.data
    }
    console.log(newMovie)
    movies.push(newMovie);
    res.status(201).json(newMovie) // actualizar cache del clientre
})

app.delete('/movies/:id',(req, res)=>{
    /*
    const origin = req.header('origin')    
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin',origin)    
    } 
    */   
    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id) 
    if(movieIndex===-1) {
        res.status(404).json({message: 'Movie not found'}) 
    }
    movies.splice(movieIndex,1)
    return res.json({message: 'Movie deleted'})
})
//Actualizar una pelicula
app.patch('/movies/:id', (req, res) =>{ // path to regexp   
    console.log(req.body) 
    const result = validatePartialMovie(req.body)
    console.log(result) 
    if(!result.success){
        return res.status(400).json({error:JSON.parse(result.error.message)})
    }

    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex===-1) {
        res.status(404).json({message: 'Movie not found'}) 
    }
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }
     
    movies[movieIndex] = updateMovie
    return res.json(updateMovie) 
    
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
})