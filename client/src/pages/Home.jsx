// Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import Card from "../components/Card";
import ProductDetails from "../components/ProductDetails";
import BrandNav from "../components/BrandNav";
import "./Home.css";

const getSectionProducts = (products, min, max = Infinity) =>
  products.filter((p) => p.price > min && p.price <= max);

const Home = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const navigate = useNavigate();

  // Parse search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  // Fetch products from backend, filtered by searchTerm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = searchTerm
          ? `http://localhost:5000/api/products?search=${encodeURIComponent(
            searchTerm
          )}`
          : "http://localhost:5000/api/products";
        const res = await axios.get(url);
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, [searchTerm]);

  // Fetch comments when a product is selected
  useEffect(() => {
    if (selected) {
      setLoadingComments(true);
      axios
        .get(`http://localhost:5000/api/products/${selected._id}/comments`)
        .then((res) => setComments(res.data))
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [selected]);

  const handleCardClick = (product) => setSelected(product);
  const handleBack = () => setSelected(null);

  const addToFav = async (productId) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/users/favorite/${user.email}`,
        { productId }
      );
      alert("Added to favourites 🎉");
    } catch (err) {
      console.error("Add-fav error:", err);
      alert("Could not add favourite");
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      alert("Please login to comment");
      return;
    }
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/products/${selected._id}/comments`,
        { user: user.email, text: newComment }
      );
      setComments(res.data);
      setNewComment("");
    } catch (err) {
      alert("Error adding comment");
    }
  };

  // Filter products by search term (case-insensitive, matches title or description)
  const filteredProducts = searchTerm
    ? products.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : products;

  // Filter by brand if selected
  const brandFilteredProducts = selectedBrand
    ? products.filter(
      (p) =>
        p.title &&
        p.title.toLowerCase().startsWith(selectedBrand.toLowerCase())
    )
    : products;

  // Section logic (use filteredProducts if you have search, else products)
  const above70 = getSectionProducts(brandFilteredProducts, 70000);
  const between50and70 = getSectionProducts(
    brandFilteredProducts,
    50000,
    70000
  );
  const between35and50 = getSectionProducts(
    brandFilteredProducts,
    35000,
    50000
  );
  const between25and35 = getSectionProducts(
    brandFilteredProducts,
    25000,
    35000
  );
  const below25 = brandFilteredProducts.filter((p) => p.price <= 25000);

  // Helper to render a section with "More" button
  const renderSection = (title, prods, sectionKey) => (
    <div className="responsive-section">
      <div className="responsive-section-header">
        <h3 className="responsive-section-title">{title}</h3>
        {prods.length > 7 && (
          <button
            className="responsive-section-more"
            onClick={() => navigate(`/section/${sectionKey}`)}
          >
            More&gt;&gt;
          </button>
        )}
      </div>
      <div className="responsive-card-grid">
        {prods.slice(0, 9).map((product) => (
          <Card
            key={product._id}
            product={product}
            onClick={() => handleCardClick(product)}
            onFav={addToFav}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="responsive-container1">
      <Banner />
      <BrandNav selectedBrand={selectedBrand} onSelect={setSelectedBrand} />
      <div className="responsive-container2">
        {/* <h2>Products</h2> */}
        <div className="products-center-box">
          {selected ? (
            <ProductDetails product={selected} onBack={handleBack} />
          ) : (
            <>
              {renderSection(
                "Mobile phones Price in Pakistan > 70,000 Rs.",
                above70,
                "above70"
              )}
              {renderSection(
                "Mobile phones Price in Pakistan 50,000 - 70,000 Rs.",
                between50and70,
                "50to70"
              )}
              {renderSection(
                "Mobile Prices Between 35,000 and 50,000 Rs.",
                between35and50,
                "35to50"
              )}
              {renderSection(
                "Mobile Prices Between 25,000 and 35,000 Rs.",
                between25and35,
                "25to35"
              )}
              {renderSection(
                "Mobile Prices Below 25,000 Rs.",
                below25,
                "below25"
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
