import "../cryptocoins/cryptocoins.css";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../../components/searchBar/SearchBar";

const CryptoCoins = () => {
  const { store, dispatch } = useGlobalReducer();
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [favorites, setFavorites] = useState({}); // Track favorites by coin ID
  const navigate = useNavigate();

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": "CG-VNhC8xXZnRp353MYKp3SvrT5",
    },
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const coinsResp = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd",
          options
        );

        if (coinsResp.ok) {
          const coinsBody = await coinsResp.json();
          dispatch({ type: "load_coins", coins: coinsBody });
          setFilteredCoins(coinsBody);

          // Initialize favorites state
          const favoriteCoins = store.favorites.reduce((acc, coin) => {
            acc[coin.id] = true;
            return acc;
          }, {});
          setFavorites(favoriteCoins);
        } else {
          throw new Error(coinsResp.statusText || "Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();
  }, [dispatch, store.favorites]);

  const handleFavorite = async (coinId) => {
    if (!store.token) {
      navigate("/login");
      return;
    }

    const isFavorite = favorites[coinId] || false;
    const updatedFavorites = { ...favorites, [coinId]: !isFavorite };

    try {
      if (isFavorite) {
        // Remove favorite
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/favorites/${coinId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${store.token}`,
            },
          }
        );

        if (response.ok) {
          dispatch({ type: "remove_favorite", coinId });
          setFavorites(updatedFavorites);
        } else {
          console.error("Failed to remove favorite:", response.statusText);
          alert(`Error removing favorite: ${response.statusText}`);
        }
      } else {
        // Add favorite
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/favorites`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${store.token}`,
            },
            body: JSON.stringify({
              favorites: [{ coin_id: coinId }],
            }),
          }
        );

        if (response.ok) {
          const favoriteCoin = store.coins.find((coin) => coin.id === coinId);
          dispatch({ type: "add_favorite", favoriteCoin });
          setFavorites(updatedFavorites);
        } else {
          console.error("Failed to add favorite:", response.statusText);
          alert(`Error adding favorite: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error handling favorite:", error);
      alert("An error occurred while handling your favorite.");
    }
  };


  const handleSearch = (searchResults) => {
    setFilteredCoins(searchResults);
  };

  return (
    <div className="CryptoCoins">
      <div className="hero">
        <h1>
          All your Cryptos at... <br /> Crypto Sense
        </h1>
        <p>Find any Crypto that you would like to find more info about!</p>
        <SearchBar coins={store.coins} onSearch={handleSearch} />
      </div>
      <div className="crypto-table">
        <div className="table-header">
          <p> </p>
          <p>#</p>
          <p>Coin</p>
          <p>Price</p>
          <p>24H Change</p>
          <p className="marketcap">Market Cap</p>
        </div>
        {filteredCoins &&
          filteredCoins.slice(0, 10).map((coin, index) => (
            <div className="table-row" key={index}>
              <div>
                <i
                  className={favorites[coin.id] ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                  onClick={() => handleFavorite(coin.id)}
                ></i>
              </div>
              <p>{coin.market_cap_rank}</p>
              <Link to={`/coin/${coin.id}`} className="coin-link">
                <img src={coin.image} alt="" />
                <p>{coin.name + " - " + coin.symbol}</p>
              </Link>
              <p>{"$ " + coin.current_price.toLocaleString()}</p>
              <p
                style={{
                  color: coin.price_change_percentage_24h >= 0 ? "lime" : "red",
                }}
              >
                {coin.price_change_percentage_24h.toFixed(2)}%
              </p>
              <p className="marketcap">$ {coin.market_cap.toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CryptoCoins;
