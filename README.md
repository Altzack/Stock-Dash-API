## Stock-dash API

### A stock dashboard to get news, data and keep track of nasdaq traded tickers.

<p float="left">
<img width="220" alt="stockdashss" src="https://user-images.githubusercontent.com/47507987/102857587-8d286400-43dd-11eb-8986-92e42a9fadba.png">
<img width="220" alt="stockdashss1" src="https://user-images.githubusercontent.com/47507987/102857601-9285ae80-43dd-11eb-9bbc-7407e46009d3.png">
</p>

- Live link: https://stock-dash.vercel.app/

- Tech stack: (PERN) PostgreSQL, Express, React, Node

## Schema

### watchlistItem

```js
{
  id: num,
  symbol: string
}
```

## API

### Endpoints

### GET `/api/watchlist`

```js
//req.query
{
  //
}

//res.body
[
  {
    id: num,
    symbol: string,
  },
];
```

### DELETE `/api/watchlist/:id`

```js
//req.query
{
  id: Id;
}

//res.body
[
  {
    //
  },
];
```

### POST `/api/watchlist`

```js
//req.body
{
  symbol: string;
}

//res.body
[
  {
    id: Id,
    symbol: string,
  },
];
```
