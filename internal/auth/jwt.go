package auth

import (
	"diplom/config"
	"time"

	"github.com/golang-jwt/jwt"
)

// Claims – кастомные данные, которые будут храниться в токене
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

type Session struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}

// GenerateToken генерирует JWT-токен для заданного пользователя и его роли
func GenerateToken(userID string, role string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Role:   role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "your-app-name",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.CFG.SecretKey)
}

// func ParseClaimsFromToken(requestToken string) (Claims, error) {
// 	token, err := jwt.Parse(requestToken, func(token *jwt.Token) (interface{}, error) {
// 		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
// 			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
// 		}
// 		return config.SecretKey, nil
// 	})

// 	if err != nil && err.Error() != "Token is expired" {
// 		return Claims{}, err
// 	}

// 	mapClaims, ok := token.Claims.(jwt.MapClaims)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token")
// 	}

// 	userID, ok := mapClaims["user_id"]
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, missing user_id")
// 	}
// 	role, ok := mapClaims["role"]
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, missing role")
// 	}
// 	exp, ok := mapClaims["exp"]
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, missing exp")
// 	}
// 	iat, ok := mapClaims["iat"]
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, missing iat")
// 	}
// 	iss, ok := mapClaims["iss"]
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, missing iss")
// 	}

// 	_, ok = userID.(int)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, user_id is not a number")
// 	}
// 	_, ok = role.(string)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, role is not a string")
// 	}
// 	_, ok = exp.(int64)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, exp is not a number")
// 	}
// 	_, ok = iat.(int64)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, iat is not a number")
// 	}
// 	_, ok = iss.(string)
// 	if !ok {
// 		return Claims{}, fmt.Errorf("invalid token, iss is not a string")
// 	}

// 	return Claims{
// 		UserID: userID.(int),
// 		Role:   role.(string),
// 		StandardClaims: jwt.StandardClaims{
// 			ExpiresAt: exp.(int64),
// 			IssuedAt:  iat.(int64),
// 			Issuer:    iss.(string),
// 		},
// 	}, nil
// }
