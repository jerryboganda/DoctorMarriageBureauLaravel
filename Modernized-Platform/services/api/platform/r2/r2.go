package r2

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Client wraps S3/R2 client and presign capabilities.
type Client struct {
	S3Client     *s3.Client
	PresignClient *s3.PresignClient
	BucketName   string
	PublicDomain string
}

// Config provides configuration needed for R2 client.
type Config struct {
	AccountID    string
	AccessKeyID  string
	AccessSecret string
	BucketName   string
	PublicDomain string
}

// New creates a new Cloudflare R2 / S3-compatible client.
func New(ctx context.Context, cfg Config) (*Client, error) {
	if cfg.BucketName == "" {
		cfg.BucketName = "dmb-media"
	}
	if cfg.PublicDomain == "" {
		cfg.PublicDomain = "https://media.doctormarriagebureau.com"
	}

	var customEndpoint string
	if cfg.AccountID != "" {
		customEndpoint = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if customEndpoint != "" {
			return aws.Endpoint{
				URL:               customEndpoint,
				SigningRegion:     "auto",
				HostnameImmutable: true,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithEndpointResolverWithOptions(customResolver),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.AccessSecret,
			"",
		)),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load aws config for r2: %w", err)
	}

	s3Client := s3.NewFromConfig(awsCfg)
	presignClient := s3.NewPresignClient(s3Client)

	return &Client{
		S3Client:      s3Client,
		PresignClient: presignClient,
		BucketName:    cfg.BucketName,
		PublicDomain:  cfg.PublicDomain,
	}, nil
}

// PresignedUploadURL generates a presigned URL for direct client upload (PUT).
func (c *Client) PresignedUploadURL(ctx context.Context, objectKey, contentType string, expiry time.Duration) (string, error) {
	if c.PresignClient == nil {
		return "", fmt.Errorf("presign client not initialized")
	}

	req, err := c.PresignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.BucketName),
		Key:         aws.String(objectKey),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned upload url: %w", err)
	}

	return req.URL, nil
}

// PresignedDownloadURL generates a presigned URL for secure object retrieval (GET).
func (c *Client) PresignedDownloadURL(ctx context.Context, objectKey string, expiry time.Duration) (string, error) {
	if c.PresignClient == nil {
		return "", fmt.Errorf("presign client not initialized")
	}

	req, err := c.PresignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.BucketName),
		Key:    aws.String(objectKey),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download url: %w", err)
	}

	return req.URL, nil
}

// DeleteObject deletes an object from R2.
func (c *Client) DeleteObject(ctx context.Context, objectKey string) error {
	if c.S3Client == nil {
		return fmt.Errorf("s3 client not initialized")
	}

	_, err := c.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.BucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object %s: %w", objectKey, err)
	}

	return nil
}

// PublicURL returns the CDN/Public URL for a given object key.
func (c *Client) PublicURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", c.PublicDomain, objectKey)
}
