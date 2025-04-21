package config

import (
	"log"

	"github.com/spf13/viper"
)

var CFG Config

type Config struct {
	Database  PostgreSQLConfig `mapstructure:"postgres" yaml:"postgres"`
	SecretKey string           `mapstructure:"secret_key" yaml:"secret_key"`
}

type PostgreSQLConfig struct {
	Host     string `mapstructure:"host" yaml:"host"`
	Port     int    `mapstructure:"port" yaml:"port"`
	Username string `mapstructure:"username" yaml:"username"`
	Password string `mapstructure:"password" yaml:"password"`
	Database string `mapstructure:"database" yaml:"database"`
}

func ConfigInit() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/app/")
	viper.AddConfigPath("/app/config/")
	viper.AddConfigPath("../../config/")

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	CFG = GetConfig()

	log.Printf("Config file used: %s", viper.ConfigFileUsed())
}

func GetConfig() Config {
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}
	return config
}
