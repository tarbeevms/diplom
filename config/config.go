package config

import (
	"log"

	"github.com/spf13/viper"
)

var CFG Config = Config{}

type Config struct {
	Database  PostgreSQLConfig `mapstructure:"postgre" yaml:"postgre"`
	SecretKey string           `mapstructure:"secret_key" yaml:"secret_key"`
}

type PostgreSQLConfig struct {
	Host     string `mapstructure:"host" yaml:"host"`
	Port     int    `mapstructure:"port" yaml:"port"`
	Username string `mapstructure:"username" yaml:"username"`
	Password string `mapstructure:"password" yaml:"password"`
	Database string `mapstructure:"database" yaml:"database"`
}

func init() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/etc/app/")

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}
}

func GetConfig() Config {
	if err := viper.Unmarshal(&CFG); err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}
	return CFG
}
