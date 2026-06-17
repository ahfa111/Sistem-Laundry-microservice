package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func main() {
	initDB()
	defer db.Close()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "payment-service"})
	})

	
	r.GET("/payments", getPayments)
	r.GET("/payments/:id", getPaymentByID)
	r.POST("/payments", createPayment)
	r.PUT("/payments/:id", updatePayment)
	r.DELETE("/payments/:id", deletePayment)


	r.GET("/payment-methods", getPaymentMethods)
	r.GET("/payment-methods/:id", getPaymentMethodByID)
	r.POST("/payment-methods", createPaymentMethod)
	r.PUT("/payment-methods/:id", updatePaymentMethod)
	r.DELETE("/payment-methods/:id", deletePaymentMethod)

	r.Run(":5000")
}

func initDB() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "root"
	}
	password := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "payment_db"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true", user, password, host, dbName)
	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}

	
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS payments (
			id INT AUTO_INCREMENT PRIMARY KEY,
			order_id INT NOT NULL,
			amount DECIMAL(10, 2) NOT NULL,
			status VARCHAR(50) DEFAULT 'pending',
			payment_method VARCHAR(50)
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS payment_methods (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			is_active BOOLEAN DEFAULT TRUE
		)
	`)
	if err != nil {
		log.Fatal(err)
	}
}


type Payment struct {
	ID            int     `json:"id"`
	OrderID       int     `json:"order_id"`
	Amount        float64 `json:"amount"`
	Status        string  `json:"status"`
	PaymentMethod string  `json:"payment_method"`
}

func getPayments(c *gin.Context) {
	rows, err := db.Query("SELECT id, order_id, amount, status, payment_method FROM payments")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	payments := []Payment{}
	for rows.Next() {
		var p Payment
		if err := rows.Scan(&p.ID, &p.OrderID, &p.Amount, &p.Status, &p.PaymentMethod); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		payments = append(payments, p)
	}
	c.JSON(http.StatusOK, payments)
}

func getPaymentByID(c *gin.Context) {
	id := c.Param("id")
	var p Payment
	err := db.QueryRow("SELECT id, order_id, amount, status, payment_method FROM payments WHERE id = ?", id).
		Scan(&p.ID, &p.OrderID, &p.Amount, &p.Status, &p.PaymentMethod)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func createPayment(c *gin.Context) {
	var p Payment
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}


	resp, err := http.Get(fmt.Sprintf("http://order-service:5002/orders/%d", p.OrderID))
	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID not valid or not found in Order Service"})
		return
	}

	if p.Status == "" {
		p.Status = "pending"
	}

	res, err := db.Exec("INSERT INTO payments (order_id, amount, status, payment_method) VALUES (?, ?, ?, ?)",
		p.OrderID, p.Amount, p.Status, p.PaymentMethod)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := res.LastInsertId()
	p.ID = int(id)
	c.JSON(http.StatusCreated, p)
}

func updatePayment(c *gin.Context) {
	id := c.Param("id")
	var p Payment
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var existing Payment
	err := db.QueryRow("SELECT order_id, amount, status, payment_method FROM payments WHERE id = ?", id).
		Scan(&existing.OrderID, &existing.Amount, &existing.Status, &existing.PaymentMethod)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if p.OrderID == 0 {
		p.OrderID = existing.OrderID
	}
	if p.Amount == 0 {
		p.Amount = existing.Amount
	}
	if p.Status == "" {
		p.Status = existing.Status
	}
	if p.PaymentMethod == "" {
		p.PaymentMethod = existing.PaymentMethod
	}

	if p.OrderID != existing.OrderID {
		resp, err := http.Get(fmt.Sprintf("http://order-service:5002/orders/%d", p.OrderID))
		if err != nil || resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID not valid or not found in Order Service"})
			return
		}
	}

	_, err = db.Exec("UPDATE payments SET order_id=?, amount=?, status=?, payment_method=? WHERE id=?",
		p.OrderID, p.Amount, p.Status, p.PaymentMethod, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func deletePayment(c *gin.Context) {
	id := c.Param("id")
	res, err := db.Exec("DELETE FROM payments WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment deleted successfully"})
}


type PaymentMethod struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

func getPaymentMethods(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, description, is_active FROM payment_methods")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	methods := []PaymentMethod{}
	for rows.Next() {
		var m PaymentMethod
		var desc sql.NullString
		if err := rows.Scan(&m.ID, &m.Name, &desc, &m.IsActive); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if desc.Valid {
			m.Description = desc.String
		}
		methods = append(methods, m)
	}
	c.JSON(http.StatusOK, methods)
}

func getPaymentMethodByID(c *gin.Context) {
	id := c.Param("id")
	var m PaymentMethod
	var desc sql.NullString
	err := db.QueryRow("SELECT id, name, description, is_active FROM payment_methods WHERE id = ?", id).
		Scan(&m.ID, &m.Name, &desc, &m.IsActive)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if desc.Valid {
		m.Description = desc.String
	}
	c.JSON(http.StatusOK, m)
}

func createPaymentMethod(c *gin.Context) {
	var m PaymentMethod
	if err := c.ShouldBindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	res, err := db.Exec("INSERT INTO payment_methods (name, description, is_active) VALUES (?, ?, ?)",
		m.Name, m.Description, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := res.LastInsertId()
	m.ID = int(id)
	m.IsActive = true
	c.JSON(http.StatusCreated, m)
}

func updatePaymentMethod(c *gin.Context) {
	id := c.Param("id")
	var m PaymentMethod
	if err := c.ShouldBindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("UPDATE payment_methods SET name=?, description=?, is_active=? WHERE id=?",
		m.Name, m.Description, m.IsActive, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment method updated"})
}

func deletePaymentMethod(c *gin.Context) {
	id := c.Param("id")
	res, err := db.Exec("DELETE FROM payment_methods WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
}
