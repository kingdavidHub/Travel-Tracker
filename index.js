import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: '@kingdavid',
  port: 5432
}); 

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function visited_countries(){
  let countries= [];
  const { rows } = await db.query('SELECT country_code FROM visited_countries');
  
  rows.forEach(country => {
    countries.push(country.country_code);
  });

  return countries;
}

app.get("/", async (req, res) => {
  const countries = await visited_countries();

  res.render('index.ejs', {
    total: countries.length, 
    countries
  });

});

app.post('/add', async (req, res) => {
  const { country: country_name } = req.body;
  
  // check if country is available in coutries database table / if user putting invalid country 
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [
        country_name.toLowerCase()
      ]);
    

    const data = result.rows[0];
    const countryCode = data.country_code;

    // check if country has already been added to visited_countries
    try {
      await db.query('INSERT INTO visited_countries (country_code) VALUES ($1)', [countryCode]);
      res.redirect('/');
      
    } catch (error) {
      console.log(error);
      const countries = await visited_countries();
  
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "country has already been added, try again."
      });   
    }

  } catch (error) {
    const countries = await visited_countries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }  
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
