import { useState } from "react";
import "./App.css";

// =====================================================
// API URL
// =====================================================
// Localhost ki jagah Render Environment Variable use hoga
const API_URL = "https://newsverity-server.onrender.com";

function App() {
  const [news, setNews] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // CHECK NEWS
  // =====================================================

  const checkNews = async () => {
    const cleanNews = news.trim();

    if (cleanNews.length < 10) {
      setError(
        "Please enter a valid news headline or article with at least 10 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        `${API_URL}/api/check-news`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            news: cleanNews,
          }),
        }
      );

      const data = await response.json();

      console.log("Analysis Response:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to analyze the news."
        );
      }

      setResult(data);
    } catch (error) {
      console.error("Analysis Error:", error);

      setError(
        error.message ||
          "Unable to connect to the analysis server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLEAR INPUT
  // =====================================================

  const clearInput = () => {
    setNews("");
    setResult(null);
    setError("");
  };

  // =====================================================
  // GET HISTORY
  // =====================================================

  const getHistory = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/history`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load history."
        );
      }

      setHistory(
        Array.isArray(data.history)
          ? data.history
          : []
      );

      setShowHistory(true);

      setTimeout(() => {
        document
          .getElementById("history")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (error) {
      console.error("History Error:", error);

      setError(
        error.message || "Unable to load history."
      );
    }
  };

  // =====================================================
  // DELETE ONE HISTORY ITEM
  // =====================================================

  const deleteHistory = async (id) => {
    if (!id) return;

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/history/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete history item."
        );
      }

      setHistory((previousHistory) =>
        previousHistory.filter(
          (item) => item._id !== id
        )
      );
    } catch (error) {
      console.error("Delete Error:", error);

      setError(
        error.message ||
          "Unable to delete history item."
      );
    }
  };

  // =====================================================
  // CLEAR ALL HISTORY
  // =====================================================

  const clearAllHistory = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/history`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to clear history."
        );
      }

      setHistory([]);
    } catch (error) {
      console.error(
        "Clear History Error:",
        error
      );

      setError(
        error.message ||
          "Unable to clear history."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // FILTER HISTORY
  // =====================================================

  const filteredHistory = history.filter(
    (item) =>
      item.news
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.prediction
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // =====================================================
  // VERDICT CLASS
  // =====================================================

  const getVerdictClass = (prediction) => {
    const value =
      prediction?.toLowerCase() || "";

    if (value.includes("true")) {
      return "true";
    }

    if (value.includes("false")) {
      return "false";
    }

    if (value.includes("misleading")) {
      return "misleading";
    }

    return "verification";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="brand">

          <div className="brand-icon">
            N
          </div>

          <div>
            <h2>NewsVerity</h2>

            <span>
              AI News Intelligence
            </span>
          </div>

        </div>

        <div className="nav-links">

          <a href="#detector">
            Analyze
          </a>

          <button
            onClick={getHistory}
            type="button"
          >
            History
          </button>

          <a href="#about">
            About
          </a>

        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <main
        className="main-content"
        id="detector"
      >

        {/* ================= HERO ================= */}

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              <span>✦</span>
              AI-POWERED NEWS ANALYSIS
            </div>

            <h1>
              Analyze News.
              <br />
              <span>Think Clearly.</span>
            </h1>

            <p>
              Evaluate news claims with AI-assisted
              analysis. Understand whether information
              appears reliable, misleading, or needs
              further verification.
            </p>

          </div>

        </section>

        {/* ================= ANALYZER ================= */}

        <section className="analyzer-card">

          <div className="analyzer-header">

            <div>

              <p className="section-label">
                NEWS ANALYZER
              </p>

              <h2>
                What would you like to verify?
              </h2>

              <p>
                Paste a headline, claim, or article
                below for AI-assisted analysis.
              </p>

            </div>

            <div className="secure-badge">
              <span>🔒</span>
              Secure Analysis
            </div>

          </div>

          {/* TEXTAREA */}

          <div className="textarea-wrapper">

            <textarea
              value={news}
              onChange={(e) =>
                setNews(e.target.value)
              }
              placeholder="Paste a news headline or article here..."
              rows="8"
              disabled={loading}
            />

            <div className="textarea-counter">
              {news.length} characters
            </div>

          </div>

          {/* INPUT FOOTER */}

          <div className="input-footer">

            <span>
              💡 For best results, provide the
              complete claim or headline.
            </span>

            <span>
              Minimum 10 characters
            </span>

          </div>

          {/* ERROR */}

          {error && (
            <div className="error-box">

              <span>⚠️</span>

              <p>
                {error}
              </p>

            </div>
          )}

          {/* ACTION BUTTONS */}

          <div className="action-buttons">

            <button
              className="analyze-btn"
              onClick={checkNews}
              disabled={loading}
              type="button"
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze News
                  <span>→</span>
                </>
              )}

            </button>

            <button
              className="clear-btn"
              onClick={clearInput}
              disabled={loading}
              type="button"
            >
              Clear
            </button>

          </div>

          {/* ================= RESULT ================= */}

          {result && (
            <section
              className={`result-card ${getVerdictClass(
                result.prediction
              )}`}
            >

              <div className="result-top">

                <div>

                  <p className="result-label">
                    ANALYSIS RESULT
                  </p>

                  <div className="verdict-badge">
                    {result.prediction}
                  </div>

                </div>

                <div className="confidence-section">

                  <div className="confidence-header">

                    <span>
                      Confidence
                    </span>

                    <strong>
                      {result.confidence}%
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${result.confidence}%`,
                      }}
                    ></div>

                  </div>

                </div>

              </div>

              <div className="result-meta">

                <div>

                  <span>
                    Risk Level
                  </span>

                  {/* FIXED: riskLevel */}
                  <strong>
                    {result.riskLevel || "N/A"}
                  </strong>

                </div>

                <div>

                  <span>
                    AI Analysis
                  </span>

                  <strong>
                    Complete
                  </strong>

                </div>

                <div>

                  <span>
                    Checked
                  </span>

                  <strong>
                    {formatDate(
                      result.createdAt ||
                        new Date()
                    )}
                  </strong>

                </div>

              </div>

              <div className="result-divider"></div>

              {/* SUMMARY */}

              {result.summary && (
                <div className="result-section">

                  <div className="result-section-title">

                    <span>
                      01
                    </span>

                    <h3>
                      Summary
                    </h3>

                  </div>

                  <p>
                    {result.summary}
                  </p>

                </div>
              )}

              {/* REASON */}

              {result.reason && (
                <div className="result-section">

                  <div className="result-section-title">

                    <span>
                      02
                    </span>

                    <h3>
                      Why this result?
                    </h3>

                  </div>

                  <p>
                    {result.reason}
                  </p>

                </div>
              )}

              {/* RECOMMENDATION */}

              {result.recommendation && (
                <div className="result-section">

                  <div className="result-section-title">

                    <span>
                      03
                    </span>

                    <h3>
                      Recommendation
                    </h3>

                  </div>

                  <p>
                    {result.recommendation}
                  </p>

                </div>
              )}

            </section>
          )}

        </section>

      </main>

      {/* ================= HISTORY ================= */}

      {showHistory && (
        <section
          className="history-section"
          id="history"
        >

          <div className="history-container">

            <div className="history-top">

              <div>

                <p className="section-label">
                  YOUR ACTIVITY
                </p>

                <h2>
                  Analysis History
                </h2>

                <p>
                  Review your previously analyzed
                  news claims.
                </p>

              </div>

              {history.length > 0 && (
                <button
                  className="clear-history-btn"
                  onClick={clearAllHistory}
                  type="button"
                >
                  🗑 Clear All
                </button>
              )}

            </div>

            {/* SEARCH */}

            <div className="search-wrapper">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search your analysis history..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />

            </div>

            {/* HISTORY ITEMS */}

            {history.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📰
                </div>

                <h3>
                  No analysis history yet
                </h3>

                <p>
                  Analyze a news claim and it will
                  appear here.
                </p>

              </div>

            ) : filteredHistory.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No matching results
                </h3>

                <p>
                  Try a different search term.
                </p>

              </div>

            ) : (

              <div className="history-list">

                {filteredHistory.map(
                  (item) => (

                    <article
                      className="history-item"
                      key={item._id}
                    >

                      <div className="history-item-top">

                        <span
                          className={`history-verdict ${getVerdictClass(
                            item.prediction
                          )}`}
                        >
                          {item.prediction}
                        </span>

                        <span className="history-date">
                          {formatDate(
                            item.createdAt
                          )}
                        </span>

                      </div>

                      <h3>
                        {item.news}
                      </h3>

                      <div className="history-info">

                        <span>
                          Confidence:{" "}
                          <strong>
                            {item.confidence}
                          </strong>
                        </span>

                      </div>

                      <p>
                        {item.reason}
                      </p>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteHistory(
                            item._id
                          )
                        }
                        type="button"
                      >
                        Delete
                      </button>

                    </article>

                  )
                )}

              </div>

            )}

          </div>

        </section>
      )}

      {/* ================= ABOUT ================= */}

      <section
        className="about"
        id="about"
      >

        <p className="section-label">
          ABOUT NEWSVERITY
        </p>

        <h2>
          AI-assisted analysis for
          <br />
          more informed reading.
        </h2>

        <p>
          NewsVerity is an AI-powered news analysis
          platform that evaluates headlines and articles
          for potential misinformation, misleading
          language, unsupported claims, and missing
          context.
        </p>

        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              🤖
            </div>

            <h3>
              AI Analysis
            </h3>

            <p>
              Context-aware analysis of each
              individual claim.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              📊
            </div>

            <h3>
              Confidence Score
            </h3>

            <p>
              Understand how confident the
              analysis is.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              🔍
            </div>

            <h3>
              Verification Focus
            </h3>

            <p>
              Encourages independent verification
              of important claims.
            </p>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer>

        <div>

          <strong>
            NewsVerity
          </strong>

          <span>
            AI-assisted news intelligence
          </span>

        </div>

        <p>
          © 2026 NewsVerity. Built as a MERN Stack
          AI project.
        </p>

      </footer>

    </div>
  );
}

export default App;